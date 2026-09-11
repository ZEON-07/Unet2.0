/**
 * InkLife API – Cloudflare Worker Entry Point
 *
 * Middleware registration order (outermost → innermost):
 *   1. Secure headers    – set security headers on every response
 *   2. CORS              – handle preflight + add CORS headers
 *   3. Request ID        – inject X-Request-Id + record start time
 *   4. Logger            – structured JSON log after response
 *   5. Rate limiter      – KV sliding-window, 60 req/60s per IP
 *   ─── route handlers ───
 *   6. Error handler     – registered via app.onError()
 */

import { Hono } from "hono";
import { validateEnv } from "./config/env";
import { secureHeadersMiddleware } from "./middleware/secureHeaders";
import { corsMiddleware } from "./middleware/cors";
import { requestIdMiddleware } from "./middleware/requestId";
import { loggerMiddleware } from "./middleware/logger";
import { rateLimitMiddleware } from "./middleware/rateLimit";
import { errorHandler } from "./middleware/errorHandler";
import { healthRoute } from "./routes/health";
import { docsRoute } from "./routes/docs";
import { brandsRoute } from "./routes/brands";
import { pensRoute } from "./routes/pens";
import { predictionsRoute } from "./routes/predictions";
import { authRoute } from "./routes/auth";
import { adminRoute } from "./routes/admin";
import type { HonoEnv } from "./types/bindings";

const app = new Hono<HonoEnv>({ strict: false });

// ─── Global middleware ────────────────────────────────────────────────────────

app.use("*", secureHeadersMiddleware());
app.use("*", corsMiddleware());
app.use("*", requestIdMiddleware());
app.use("*", loggerMiddleware());
app.use("*", rateLimitMiddleware());

// ─── Routes ───────────────────────────────────────────────────────────────────

app.route("/api/health", healthRoute);
app.route("/api/docs", docsRoute);

// ─── Phase 1: Public Read APIs ────────────────────────────────────────────────
app.route("/api/brands", brandsRoute);
app.route("/api/pens", pensRoute);

// ─── Phase 2: Prediction Engine ───────────────────────────────────────────────
app.route("/api/predictions", predictionsRoute);

// ─── Phase 3: Auth + Admin ────────────────────────────────────────────────────
app.route("/api/auth", authRoute);
app.route("/api/admin", adminRoute);

// ─── 404 fallback ─────────────────────────────────────────────────────────────

app.notFound((c) => {
  const requestId = c.get("requestId") ?? "unknown";
  return c.json(
    {
      success: false,
      error: {
        code: "NOT_FOUND",
        message: `Route ${c.req.method} ${new URL(c.req.url).pathname} not found`,
      },
      requestId,
      timestamp: new Date().toISOString(),
    },
    404
  );
});

// ─── Central error handler ────────────────────────────────────────────────────

app.onError(errorHandler);

// ─── Worker export ────────────────────────────────────────────────────────────

export default {
  async fetch(
    request: Request,
    env: HonoEnv["Bindings"],
    ctx: ExecutionContext
  ): Promise<Response> {
    // Validate required env vars at runtime (fails fast on misconfiguration)
    try {
      validateEnv(env);
    } catch (err) {
      console.error(JSON.stringify({ level: "error", error: String(err) }));
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "CONFIGURATION_ERROR",
            message: "Server is misconfigured. Check worker environment variables.",
          },
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return app.fetch(request, env, ctx);
  },
} satisfies ExportedHandler<HonoEnv["Bindings"]>;
