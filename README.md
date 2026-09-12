# InkLife Backend (SQLite & Prisma)

InkLife is a laboratory pen-life and writing-distance prediction service. This backend is configured with **SQLite** and **Prisma ORM** for lightweight, reliable hackathon and Coolify single-replica production deployments.

---

## Architecture & Features

- **Runtime**: Node.js & TypeScript
- **HTTP Server**: Fastify
- **Database**: SQLite with Prisma ORM
- **Concurrency**: SQLite configured with `PRAGMA journal_mode = WAL;`, `busy_timeout = 5000;`, `foreign_keys = ON;`
- **Caching**: Flexible `CacheService` (Redis when `REDIS_URL` is set, with automatic fallback to an in-memory TTL cache and rate limiter)
- **Data Safety**: Persistent SQLite database file mounted to a dedicated storage volume

---

## Local Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Generate Prisma Client & Run Migrations
```bash
npx prisma generate
npx prisma migrate dev
```

### 3. Seed Database (Idempotent)
```bash
npx prisma db seed
```

### 4. Start Development Server
```bash
npm run dev
```

The backend server will listen on `http://localhost:3001`.

---

## Database Configuration

### Local Database
```env
DATABASE_URL="file:./dev.db"
```

### Production Database (Coolify)
```env
DATABASE_URL="file:/app/data/inklife.db"
```

---

## Coolify Production Deployment

### Deployment Specifications
- **Application Port**: `3001`
- **Persistent Volume Destination**: `/app/data`
- **Replicas**: `1` *(Strict requirement for SQLite)*
- **Health Check Path**: `/api/health`
- **Start Command**: `npx prisma migrate deploy && npm start`

> [!IMPORTANT]
> **Required backend replicas: 1**  
> Because SQLite uses a local database file with filesystem-level locks in WAL mode, the application MUST be deployed with exactly **1 replica**. Running multiple replicas against the same SQLite file over network filesystems can cause lock contention or database corruption.

### Environment Variables for Coolify
```env
NODE_ENV=production
PORT=3001
DATABASE_URL="file:/app/data/inklife.db"
JWT_SECRET=your-secure-random-jwt-secret-key
CORS_ORIGIN=http://your-frontend-domain.com
# Optional Redis
REDIS_URL=
```

### First-Time Production Seeding
After the first successful deployment in Coolify, open the Coolify terminal and run:
```bash
npx prisma db seed
```

---

## Optional Redis Behaviour

- **When `REDIS_URL` is provided**: The backend connects to Redis for search response caching and distributed rate limiting.
- **When `REDIS_URL` is omitted**: The backend automatically falls back to an in-memory cache and sliding-window rate limiter, logging:
  ```text
  Redis is not configured; using in-memory fallback.
  ```
- **In-Memory Cache Limitations**:
  - Resets when the backend restarts.
  - Suitable for single backend instances (`Replicas: 1`).
  - Prediction history, pens, claims, and brands are stored permanently in SQLite and are unaffected by restarts.

---

## Backup & Maintenance

### Database File Location
In production, the active SQLite file resides at `/app/data/inklife.db` inside the persistent volume.

### Recommended Backup Command
Because SQLite is configured in **WAL (Write-Ahead Logging)** mode, directly copying `inklife.db` while active transactions are in flight may yield an inconsistent snapshot. Instead, use SQLite's native safe backup utility:

```bash
sqlite3 /app/data/inklife.db ".backup '/app/data/inklife-backup.db'"
```

Alternatively, if `sqlite3` CLI is unavailable:
```bash
cp /app/data/inklife.db /app/data/inklife-backup.db
cp /app/data/inklife.db-wal /app/data/inklife-backup.db-wal 2>/dev/null || true
```

---

## How to Migrate to PostgreSQL Later

To transition from SQLite back to PostgreSQL in a larger multi-replica cluster:

1. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Update `.env`:
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/inklife?schema=public"
   ```
3. Archive SQLite migrations if desired:
   ```bash
   mkdir -p prisma/migrations-sqlite-backup
   mv prisma/migrations/* prisma/migrations-sqlite-backup/
   ```
4. Generate PostgreSQL migrations:
   ```bash
   npx prisma migrate dev --name postgresql_init
   npx prisma db seed
   ```

---

## Running Tests

Run the test suite using an isolated test database (`test.db`):
```bash
npm test
```

Verifies:
- SQLite connection and PRAGMA settings (`WAL`, `foreign_keys`, `busy_timeout`)
- Migration execution
- Seed idempotency (runs twice without duplicate key errors)
- Core predictions: BIC at 9% produces exactly 270m remaining, ~230m usable, 31 Long Book, 38 Queen Book, and 47 King Book pages
- In-memory cache fallback without Redis
- Zero-ink safety boundaries
