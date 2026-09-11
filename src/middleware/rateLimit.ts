import type { MiddlewareHandler } from "hono";
import type { HonoEnv } from "../types/bindings";
import { RateLimitError } from "../utils/errors";

// ─── Configuration ────────────────────────────────────────────────────────────

/** Maximum requests allowed per window */
const LIMIT = 60;
/** Sliding window size in seconds */
const WINDOW_SECONDS = 60;

// ─── Rate Limit Middleware ────────────────────────────────────────────────────

/**
 * KV-backed sliding-window rate limiter.
 *
 * Key format: `ratelimit:{ip}:{windowStart}` where windowStart is the Unix
 * epoch second rounded down to the nearest WINDOW_SECONDS boundary.
 *
 * Each KV entry stores a simple integer counter and is set to expire at the
 * end of the window via `expirationTtl`. This avoids the need for explicit
 * cleanup and keeps KV usage minimal.
 *
 * Responds with 429 + Retry-After header when limit is exceeded.
 * Adds X-RateLimit-* headers to all responses.
 */
export const rateLimitMiddleware = (): MiddlewareHandler<HonoEnv> =>
  async (c, next) => {
    const kv = c.env.RATE_LIMIT_KV;

    // Derive client IP from Cloudflare-forwarded header or fallback
    const ip =
      c.req.header("CF-Connecting-IP") ??
      c.req.header("X-Forwarded-For")?.split(",")[0]?.trim() ??
      "anonymous";

    // Current window bucket (aligned to WINDOW_SECONDS)
    const windowStart = Math.floor(Date.now() / 1000 / WINDOW_SECONDS) * WINDOW_SECONDS;
    const key = `ratelimit:${ip}:${windowStart}`;

    // Read current count (may be null for first request in window)
    const currentStr = await kv.get(key);
    const current = currentStr ? parseInt(currentStr, 10) : 0;

    const remaining = Math.max(0, LIMIT - current - 1);
    const resetAt = windowStart + WINDOW_SECONDS;

    // Set rate limit headers on all responses
    c.header("X-RateLimit-Limit", String(LIMIT));
    c.header("X-RateLimit-Remaining", String(remaining));
    c.header("X-RateLimit-Reset", String(resetAt));

    if (current >= LIMIT) {
      const retryAfter = resetAt - Math.floor(Date.now() / 1000);
      c.header("Retry-After", String(retryAfter));
      throw new RateLimitError(retryAfter);
    }

    // Increment counter. KV expirationTtl must be ≥ 60s.
    // Use the full window duration to ensure the entry always expires correctly.
    const ttl = Math.max(60, WINDOW_SECONDS + 1);
    await kv.put(key, String(current + 1), { expirationTtl: ttl });

    await next();
  };
