import { cors } from "hono/cors";
import type { HonoEnv } from "../types/bindings";
import type { MiddlewareHandler } from "hono";

/**
 * CORS middleware.
 * Reads the allowed origin from the CORS_ORIGIN binding (set in wrangler.toml
 * vars or .dev.vars). Falls back to http://localhost:3000 for safety.
 */
export const corsMiddleware = (): MiddlewareHandler<HonoEnv> =>
  async (c, next) => {
    const origin = c.env.CORS_ORIGIN ?? "http://localhost:3000";

    return cors({
      origin,
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: [
        "Content-Type",
        "Authorization",
        "X-Request-Id",
        "X-Api-Key",
      ],
      exposeHeaders: ["X-Request-Id", "X-RateLimit-Limit", "X-RateLimit-Remaining"],
      maxAge: 86400, // 24h preflight cache
      credentials: true,
    })(c, next);
  };
