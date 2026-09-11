import { Hono } from "hono";
import type { HonoEnv } from "../types/bindings";

const health = new Hono<HonoEnv>();

/**
 * GET /api/health
 * Public liveness check. Returns 200 when the Worker is running.
 * Optionally probes the D1 database to confirm connectivity.
 */
health.get("/", async (c) => {
  const requestId = c.get("requestId") ?? "unknown";
  const environment = c.env.ENVIRONMENT ?? "unknown";

  // Lightweight DB probe: run a no-op query to confirm D1 is reachable
  let dbStatus: "ok" | "error" = "ok";
  let dbLatencyMs: number | undefined;

  try {
    const t0 = Date.now();
    await c.env.DB.prepare("SELECT 1").run();
    dbLatencyMs = Date.now() - t0;
  } catch {
    dbStatus = "error";
  }

  const status = dbStatus === "ok" ? "ok" : "degraded";
  const httpStatus = status === "ok" ? 200 : 503;

  return c.json(
    {
      success: true,
      data: {
        status,
        environment,
        version: "0.1.0",
        timestamp: new Date().toISOString(),
        services: {
          database: {
            status: dbStatus,
            ...(dbLatencyMs !== undefined && { latencyMs: dbLatencyMs }),
          },
        },
      },
      requestId,
    },
    httpStatus
  );
});

export { health as healthRoute };
