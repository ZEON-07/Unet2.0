# InkLife Deployment & Operations Guide

This guide documents deploying the InkLife full-stack application with:
- **Frontend**: Vercel (Next.js 16)
- **Backend**: Render Web Service (Fastify + TypeScript)
- **Database**: SQLite with WAL mode on a Render Persistent Disk
- **Local Dev**: Frontend on `http://localhost:3000`, Backend on `http://localhost:3001`

---

## 1. Local Development Setup

### Prerequisites
- Node.js 20+ (LTS recommended)
- npm 10+

### Backend Installation & Startup
```bash
# 1. Install dependencies
npm install

# 2. Configure local environment variables
cp .env.example .env

# 3. Generate Prisma client
npm run prisma:generate

# 4. Apply migrations to local dev.db
npm run prisma:migrate

# 5. Seed initial data (idempotent: brands, models, claims, admin)
npm run prisma:seed

# 6. Start local backend in watch mode (listening on http://localhost:3001)
npm run dev
```

### Frontend Installation & Startup
```bash
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Configure frontend environment variables
cp .env.example .env.local

# 4. Start Next.js development server (listening on http://localhost:3000)
npm run dev
```

---

## 2. Environment Variables

### Backend (`.env` locally, Render Dashboard in Production)

| Variable | Local Value | Render Production Value | Description |
|---|---|---|---|
| `NODE_ENV` | `development` | `production` | Runtime environment |
| `HOST` | `0.0.0.0` | `0.0.0.0` | Bind host address |
| `PORT` | `3001` | *(auto-assigned by Render)* | Port provided dynamically by Render |
| `DATABASE_URL` | `file:./dev.db` | `file:/opt/render/project/src/data/inklife.db` | SQLite database path on persistent disk |
| `CORS_ORIGIN` | `http://localhost:3000` | `https://your-inklife-app.vercel.app` | Comma-separated allowed frontend origins |
| `JWT_SECRET` | *(random 32+ chars)* | *(strong secret)* | Secret for auth tokens |
| `SEARCH_PROVIDER` | `tavily` | `tavily` | Online claim extractor provider |
| `TAVILY_API_KEY` | *(optional)* | *(your API key)* | Optional claim extraction search key |

### Frontend (`frontend/.env.local` locally, Vercel Dashboard in Production)

| Variable | Local Value | Vercel Production Value | Description |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | `https://inklife-api.onrender.com` | Backend API URL (without trailing slash) |
| `NEXT_PUBLIC_USE_MOCK_API` | `false` | `false` | Fallback flag |

---

## 3. Render Backend Deployment

### Service Settings
- **Service Type**: Web Service
- **Root Directory**: `.` (Repository root)
- **Environment**: Node
- **Region**: Any region (e.g. Frankfurt, Oregon)
- **Health Check Path**: `/api/health`

### Build & Start Commands
- **Build Command**:
  ```bash
  npm ci && npx prisma generate && npm run build
  ```
- **Start Command**:
  ```bash
  npx prisma migrate deploy && npm start
  ```

### Persistent Disk Configuration
> [!IMPORTANT]
> **Single Instance Constraint**: SQLite requires single-writer semantics. In Render settings, keep **Instances = 1** (`Replicas: 1`). Never scale to multiple instances when using a single SQLite database file.

1. In Render Dashboard, go to **Disks** -> **Add Disk**.
2. **Name**: `inklife-data`
3. **Mount Path**: `/opt/render/project/src/data`
4. **Size**: `1 GB` (or larger if storing extended audit logs)

### One-Time Initial Database Seed on Render
Once the backend web service is deployed and healthy on Render, open the Render **Shell** tab and run:
```bash
npx prisma db seed
```
This populates standard pen brands (BIC, Flair, Hauser, Linc, Pentel), initial verified models, and system admin accounts. It is idempotent and safe to run multiple times.

---

## 4. Vercel Frontend Deployment

### Project Settings
1. Import repository into Vercel.
2. Set **Root Directory**: `frontend`
3. Framework Preset: **Next.js**
4. Set Environment Variables:
   - `NEXT_PUBLIC_API_URL`: `https://<your-render-service-name>.onrender.com`
   - `NEXT_PUBLIC_USE_MOCK_API`: `false`
5. Click **Deploy**.

---

## 5. Deployment Order
1. **Deploy Backend on Render**:
   - Set persistent disk mount to `/opt/render/project/src/data`.
   - Set environment variables (`DATABASE_URL=file:/opt/render/project/src/data/inklife.db`, etc.).
   - Deploy and verify `/api/health` returns `200 OK`.
   - Note the Render URL (e.g., `https://inklife-api.onrender.com`).
2. **Deploy Frontend on Vercel**:
   - Set Root Directory to `frontend`.
   - Set `NEXT_PUBLIC_API_URL` to your Render service URL.
   - Deploy frontend.
3. **Update Backend CORS**:
   - In Render, set `CORS_ORIGIN` to your Vercel production domain (e.g., `https://inklife.vercel.app`).
   - Save changes (Render will trigger a zero-downtime restart).

---

## 6. Verification & Health Checklist

### 1. Test Backend Health
```bash
curl -i https://inklife-api.onrender.com/api/health
```
Expected Response (HTTP 200):
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "inklife-api",
    "environment": "production",
    "version": "0.1.0",
    "services": {
      "database": {
        "status": "ok",
        "latencyMs": 1
      }
    }
  }
}
```

### 2. Test Pens Endpoint
```bash
curl -i "https://inklife-api.onrender.com/api/pens?brand=bic"
```
Expected Response (HTTP 200): Contains BIC Cristal Original with nominal mileage `3000`.

### 3. Test 3D Model Asset
```bash
curl -I https://inklife.vercel.app/models/pen-refill.glb
```
Expected Response: `HTTP 200 OK` with `content-type: model/gltf-binary` or `application/octet-stream`.

### 4. Verify Disk Persistence Across Backend Redeployment
1. In the frontend, perform an ink calculation for a pen.
2. In Render dashboard, click **Manual Deploy** -> **Clear build cache & deploy**.
3. Once restarted, run `curl https://inklife-api.onrender.com/api/pens` or check the saved prediction ID. All data remains preserved on the persistent disk mounted at `/opt/render/project/src/data`.
