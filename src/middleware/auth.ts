/**
 * JWT auth middleware and admin guard for Hono.
 *
 * Middleware order on protected routes:
 *   jwtAuthMiddleware() → verifies token, attaches jwtUser to context
 *   adminGuard()        → checks role === "admin"
 */

import { jwtVerify } from "jose";
import type { MiddlewareHandler } from "hono";
import type { HonoEnv } from "../types/bindings";
import { UnauthorizedError, ForbiddenError } from "../utils/errors";

/**
 * Verify `Authorization: Bearer <token>` and attach the decoded payload
 * to `c.get("jwtUser")`.
 *
 * Throws:
 *  - 401 UnauthorizedError if the header is missing, malformed, or the token
 *    is invalid/expired.
 */
export const jwtAuthMiddleware = (): MiddlewareHandler<HonoEnv> =>
  async (c, next) => {
    const authHeader = c.req.header("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedError("Missing or malformed Authorization header. Expected: Bearer <token>");
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      throw new UnauthorizedError("Empty token in Authorization header");
    }

    const secret = new TextEncoder().encode(
      (c.env?.JWT_SECRET ?? process.env.JWT_SECRET) ||
      "super-secret-inklife-jwt-key-32-chars-long!"
    );

    try {
      const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });

      // Attach to Hono context for downstream handlers
      c.set("jwtUser", {
        sub: payload.sub as string,
        email: payload.email as string,
        role: payload.role as string,
        exp: payload.exp as number,
        iat: payload.iat as number,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Token verification failed";
      throw new UnauthorizedError(`Invalid or expired token: ${msg}`);
    }

    await next();
  };

/**
 * Guard that must run AFTER jwtAuthMiddleware.
 * Returns 403 if the authenticated user is not an admin.
 */
export const adminGuard = (): MiddlewareHandler<HonoEnv> =>
  async (c, next) => {
    const user = c.get("jwtUser");
    if (!user || user.role !== "admin") {
      throw new ForbiddenError("Admin access required");
    }
    await next();
  };
