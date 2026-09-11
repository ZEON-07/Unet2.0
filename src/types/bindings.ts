/**
 * Cloudflare Workers environment bindings.
 * This type is used throughout the app via Hono's `Env` generic.
 */
export interface Bindings {
  // ── Cloudflare D1 Database ─────────────────────────────────────────────────
  DB: D1Database;

  // ── Cloudflare KV (rate limiting) ──────────────────────────────────────────
  RATE_LIMIT_KV: KVNamespace;

  // ── Environment variables (non-secret) ────────────────────────────────────
  ENVIRONMENT: "development" | "staging" | "production";
  CORS_ORIGIN: string;
  ADMIN_EMAILS: string; // comma-separated

  // ── Secrets (set via `wrangler secret put`) ───────────────────────────────
  JWT_SECRET: string;
}

/** Hono Variables passed through context */
export interface Variables {
  requestId: string;
  startTime: number;
}

/** Combined Hono Env type */
export type HonoEnv = {
  Bindings: Bindings;
  Variables: Variables;
};
