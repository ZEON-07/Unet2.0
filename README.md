# InkLife Backend API

A high-performance pen lifecycle and mileage prediction engine built on Cloudflare Workers, D1 (distributed SQLite), and KV.

[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![Hono](https://img.shields.io/badge/Hono-v4-E36002?logo=hono&logoColor=white)](https://hono.dev/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-C5F74F?logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![OpenAPI 3.1](https://img.shields.io/badge/OpenAPI-3.1-6BA539?logo=openapiinitiative&logoColor=white)](http://localhost:8787/api/docs)

---

## Overview

InkLife provides precise writing-distance and notebook-page predictions for pens based on:
1. **Manufacturer claims & physical testing** (e.g. 3,000m for BIC Cristal, 10,000m for Flair Writo-meter).
2. **Ink flow physics** (flow factors for liquid rollerball, gel, smooth hybrid, ballpoint, fineliner).
3. **User writing style** (pressure & angle factors: light, normal, heavy).
4. **Notebook page formats** (standard Long Book, Queen Book, King Book sizing).
5. **Automated web-search lookup pipeline** with 30-day KV caching to continuously discover writing-length claims for curation.
6. **Curated Admin moderation** with cryptographic JWT security and full audit logging.

---

## Technology Stack

| Concern | Technology | Purpose |
|---|---|---|
| **Runtime** | Cloudflare Workers | Edge serverless execution with sub-millisecond cold starts |
| **Framework** | Hono v4 | Lightweight routing, OpenAPI integration, and middleware |
| **Database** | Cloudflare D1 (SQLite) | Distributed relational storage managed via Drizzle ORM |
| **ORM** | Drizzle ORM | Type-safe migrations, queries, and schema definitions |
| **Key-Value Store** | Cloudflare KV | Sliding-window rate limiting & 30-day search cache |
| **Authentication** | `jose` (Web Crypto) | Cryptographic JWT signing/verification with PBKDF2 hashing |
| **Validation** | Zod | Runtime schema validation for requests and environment |
| **Tooling** | Wrangler v3 + tsx | Local emulation, migrations, seeding, and live deployment |

---

## Architecture & Directory Structure

```
├── drizzle/
│   ├── migrations/            # Auto-generated SQL schema migrations (0000–0003)
│   ├── schema.ts              # Full Drizzle ORM database schema definitions
│   ├── seed.sql               # Seed data SQL (BIC, Flair, Hauser, sources, claims)
│   └── seed.ts                # Seed metadata types
├── src/
│   ├── config/                # Runtime environment and secrets validation
│   ├── middleware/            # Security headers, CORS, request IDs, rate limiting, JWT auth
│   ├── providers/             # Search provider abstraction (Tavily + Stub fallback)
│   ├── repositories/          # D1 SQLite query abstraction layer
│   ├── routes/                # Hono route definitions:
│   │   ├── health.ts          # Liveness and DB check
│   │   ├── docs.ts            # Swagger UI & OpenAPI 3.1 JSON spec
│   │   ├── brands.ts          # Public brand directory
│   │   ├── pens.ts            # Public pen model search and details
│   │   ├── predictions.ts     # Core mileage prediction calculation
│   │   ├── auth.ts            # Admin login
│   │   ├── admin.ts           # Protected pen & claim moderation
│   │   └── searchLookups.ts   # Automated web search pipeline
│   ├── services/              # Pure business logic and orchestration
│   ├── tests/                 # Automated test suites (prediction engine, extractors, E2E)
│   ├── types/                 # Cloudflare environment and Hono bindings
│   ├── utils/                 # App errors, crypto, claim extractor, Zod helpers
│   ├── validators/            # Request body and query parameter Zod schemas
│   └── index.ts               # Cloudflare Worker entry point
├── .dev.vars.example          # Local environment template
├── wrangler.toml              # Cloudflare Workers configuration
└── package.json
```

---

## Environment Variables & Secrets

Configure secrets in `.dev.vars` for local development, and in Cloudflare Secrets for production:

| Variable | Target | Required | Description |
|---|---|---|---|
| `ENVIRONMENT` | `wrangler.toml` | Yes | `development` \| `staging` \| `production` |
| `CORS_ORIGIN` | `wrangler.toml` / `.dev.vars` | Yes | Allowed frontend origin (e.g. `http://localhost:3000`) |
| `ADMIN_EMAILS` | `wrangler.toml` / `.dev.vars` | No | Comma-separated admin email list |
| `JWT_SECRET` | `.dev.vars` / Cloudflare Secret | Yes | Secret key for JWT signing (≥ 16 characters) |
| `TAVILY_API_KEY` | `.dev.vars` / Cloudflare Secret | No | Web search API key (optional; stub provider used if omitted) |

---

## Local Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Local Secrets
```bash
cp .dev.vars.example .dev.vars
# Edit .dev.vars to ensure JWT_SECRET is set
```

### 3. Run Migrations & Seed Database
```bash
# Apply SQL migrations to local D1
npm run db:migrate:local

# Seed default brands, pens, sources, and verified claims
npm run db:seed:local
```

### 4. Start Local Dev Server
```bash
npm run dev
# Server running at http://localhost:8787
```

### 5. Access Interactive Documentation
Open **[http://localhost:8787/api/docs](http://localhost:8787/api/docs)** in your browser for the Swagger UI, or fetch **[http://localhost:8787/openapi.json](http://localhost:8787/openapi.json)**.

---

## Admin Account & Workflow

InkLife seeds an administrative user with the following default credentials in local development:
- **Email**: `admin@example.com`
- **Password**: `Admin@inklife1`
- **Role**: `admin`

### Authenticate as Admin
```bash
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin@inklife1"}'
```
Response:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "01919000-0000-7000-8000-000000000000",
      "email": "admin@example.com",
      "role": "admin"
    }
  },
  "requestId": "..."
}
```

### Review & Approve Pending Claims
Use the returned Bearer token in the `Authorization` header:
```bash
# 1. Fetch unverified pending claims
curl http://localhost:8787/api/admin/claims/pending \
  -H "Authorization: Bearer <TOKEN>"

# 2. Verify or reject a claim
curl -X PATCH http://localhost:8787/api/admin/claims/<CLAIM_ID> \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"isVerified": true, "notes": "Verified against manufacturer specifications"}'
```

---

## API Usage Examples

### 1. Calculate Ink Prediction (Known Pen)
```bash
curl -X POST http://localhost:8787/api/predictions \
  -H "Content-Type: application/json" \
  -d '{
    "penModelId": "01919000-0000-7000-8000-000000000010",
    "inkRating": 8,
    "writingStyle": "normal",
    "notebookType": "queen_book"
  }'
```
Response:
```json
{
  "success": true,
  "data": {
    "id": "...",
    "penName": "BIC Cristal Original",
    "inkRating": 8,
    "inkPercentage": 80,
    "totalWritingLengthMeters": 3000,
    "remainingDistanceMeters": 2400,
    "usableDistanceMeters": 2400,
    "estimatedPages": 600,
    "pageEstimates": {
      "longBook": 706,
      "queenBook": 600,
      "kingBook": 500
    },
    "flowCategory": "normal_ballpoint",
    "writingStyle": "normal",
    "notebookType": "queen_book",
    "confidence": "medium",
    "isFallbackEstimate": false,
    "source": {
      "title": "BIC Official",
      "url": "https://www.bicworld.com",
      "checkedAt": "2026-09-11T19:47:27.622Z"
    }
  }
}
```

### 2. Calculate Ink Prediction (Manual Entry / Unlisted Pen)
```bash
curl -X POST http://localhost:8787/api/predictions \
  -H "Content-Type: application/json" \
  -d '{
    "enteredBrand": "Pilot",
    "enteredModel": "G2",
    "inkRating": 5,
    "writingStyle": "heavy",
    "notebookType": "long_book"
  }'
```

### 3. Run Web-Search Claim Discovery
```bash
curl -X POST http://localhost:8787/api/search-lookups \
  -H "Content-Type: application/json" \
  -d '{"brand": "Hauser", "model": "XO"}'
```

---

## Error Envelope Standard

All errors return a consistent, uniform JSON structure:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "path": "inkRating",
        "message": "Number must be less than or equal to 10"
      }
    ]
  },
  "requestId": "fd092524-c237-4d96-aae3-0a649cc8349f",
  "timestamp": "2026-09-11T19:32:58.732Z"
}
```

HTTP Status Codes:
- `200` / `201`: Success
- `401`: Unauthorized (Missing/invalid JWT)
- `403`: Forbidden (Admin role required)
- `404`: Resource not found
- `409`: Conflict (Duplicate slug or resource)
- `422`: Validation error (Zod schema validation failure)
- `429`: Rate limit exceeded (Includes `Retry-After` header)
- `500`: Internal server error

---

## Production Deployment to Cloudflare

### 1. Create Remote Cloudflare Resources
```bash
# Create remote D1 database
wrangler d1 create inklife-db

# Create remote KV namespaces
wrangler kv namespace create RATE_LIMIT_KV
wrangler kv namespace create SEARCH_CACHE_KV
```

Update your `wrangler.toml` with the generated `database_id` and KV namespace IDs.

### 2. Set Production Secrets
```bash
wrangler secret put JWT_SECRET
wrangler secret put TAVILY_API_KEY
```

### 3. Apply Remote Migrations & Seed Data
```bash
npm run db:migrate:remote
npm run db:seed:remote
```

### 4. Deploy the Worker
```bash
npm run deploy
```

---

## Testing & Verification

Run all automated unit tests (prediction formulas, claim extractors, query parsers):
```bash
npm test
```

Run TypeScript compilation check:
```bash
npm run type-check
```

Run the live End-to-End verification script against your running dev server:
```bash
npx tsx src/tests/e2e.verify.ts
```
