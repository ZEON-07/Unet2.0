import type { MiddlewareHandler } from "hono";
import type { HonoEnv } from "../types/bindings";

/**
 * Secure HTTP headers middleware.
 * Sets a baseline set of security headers on every response.
 * These complement Cloudflare's network-level protections.
 */
export const secureHeadersMiddleware = (): MiddlewareHandler<HonoEnv> =>
  async (c, next) => {
    await next();

    // Prevent MIME-type sniffing
    c.header("X-Content-Type-Options", "nosniff");

    // Prevent clickjacking
    c.header("X-Frame-Options", "DENY");

    // Control referrer information
    c.header("Referrer-Policy", "strict-origin-when-cross-origin");

    // Restrict browser feature access
    c.header(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(), payment=()"
    );

    // Force HTTPS for 1 year (only meaningful in production)
    if (c.env.ENVIRONMENT !== "development") {
      c.header(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains; preload"
      );
    }

    // Restrict cross-origin information leakage
    c.header("Cross-Origin-Opener-Policy", "same-origin");
    c.header("Cross-Origin-Resource-Policy", "cross-origin");

    // Basic XSS filter for older browsers
    c.header("X-XSS-Protection", "1; mode=block");

    // Content Security Policy (relaxed for API – no HTML served except /docs)
    c.header(
      "Content-Security-Policy",
      "default-src 'none'; script-src 'self' 'unsafe-inline' cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' cdn.jsdelivr.net; img-src 'self' data:; connect-src 'self'"
    );
  };
