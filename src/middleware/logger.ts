import type { MiddlewareHandler } from "hono";
import type { HonoEnv } from "../types/bindings";

/**
 * Structured JSON logging middleware.
 * Logs a single line per request after it completes with the shape:
 * { level, requestId, method, path, status, durationMs, timestamp, env }
 *
 * Uses console.log which surfaces in `wrangler tail` / Cloudflare Logpush.
 */
export const loggerMiddleware = (): MiddlewareHandler<HonoEnv> =>
  async (c, next) => {
    await next();

    const requestId = c.get("requestId") ?? "unknown";
    const startTime = c.get("startTime") ?? Date.now();
    const durationMs = Date.now() - startTime;
    const status = c.res.status;

    const level = status >= 500 ? "error" : status >= 400 ? "warn" : "info";

    const log = {
      level,
      requestId,
      method: c.req.method,
      path: new URL(c.req.url).pathname,
      status,
      durationMs,
      timestamp: new Date().toISOString(),
      env: c.env.ENVIRONMENT ?? "unknown",
    };

    // In Workers, console.log is forwarded to Cloudflare's logging pipeline
    console.log(JSON.stringify(log));
  };
