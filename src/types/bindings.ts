/**
 * Cloudflare Workers environment bindings.
 * This type is used throughout the app via Hono's Env generic.
 */
export interface Bindings {
  // Database & Cache bindings (optional / fallback in Node.js)
  DB?: any;
  RATE_LIMIT_KV?: any;
  SEARCH_CACHE_KV?: any;

  // Environment variables (non-secret)
  ENVIRONMENT: "development" | "staging" | "production";
  CORS_ORIGIN: string;
  ADMIN_EMAILS: string; // comma-separated

  // Secrets (set via `wrangler secret put`)
  JWT_SECRET: string;
  TAVILY_API_KEY: string; // optional: if absent, stub provider is used
}

/**
 * Decoded JWT payload attached to context by jwtAuthMiddleware.
 */
export interface JwtPayload {
  sub: string;    // user id
  email: string;
  role: string;   // "user" | "admin"
  exp: number;
  iat: number;
}

/** Hono Variables passed through context */
export interface Variables {
  requestId: string;
  startTime: number;
  jwtUser: JwtPayload; // set by jwtAuthMiddleware after successful verification
}

/** Combined Hono Env type */
export type HonoEnv = {
  Bindings: Bindings;
  Variables: Variables;
};
