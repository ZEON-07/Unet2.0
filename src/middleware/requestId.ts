import type { MiddlewareHandler } from "hono";
import type { HonoEnv } from "../types/bindings";

/**
 * Request ID middleware.
 * Reads the incoming X-Request-Id header (forwarded by CDN/load balancer) or
 * generates a fresh UUID. Stores it in Hono context variables and echoes it
 * back in the response header.
 */
export const requestIdMiddleware = (): MiddlewareHandler<HonoEnv> =>
  async (c, next) => {
    const incoming = c.req.header("X-Request-Id");
    const requestId =
      incoming && incoming.length <= 128
        ? incoming
        : crypto.randomUUID();

    c.set("requestId", requestId);
    c.set("startTime", Date.now());

    await next();

    c.header("X-Request-Id", requestId);
  };
