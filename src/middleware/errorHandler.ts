import type { ErrorHandler } from "hono";
import { ZodError } from "zod";
import type { HonoEnv } from "../types/bindings";
import { AppError } from "../utils/errors";

/**
 * Central error handler for Hono.
 * Must be registered with `app.onError(errorHandler)` (not as middleware).
 *
 * Serialises errors into a consistent JSON shape:
 * { success: false, error: { code, message, details? }, requestId, timestamp }
 */
export const errorHandler: ErrorHandler<HonoEnv> = (err, c) => {
  const requestId = c.get("requestId") ?? "unknown";
  const timestamp = new Date().toISOString();

  // ── Zod validation errors ────────────────────────────────────────────────
  if (err instanceof ZodError) {
    const issues = err.errors.map((e) => ({
      path: e.path.join("."),
      message: e.message,
      code: e.code,
    }));

    console.warn(
      JSON.stringify({
        level: "warn",
        requestId,
        error: "VALIDATION_ERROR",
        issues,
        timestamp,
      })
    );

    return c.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details: issues,
        },
        requestId,
        timestamp,
      },
      422
    );
  }

  // ── Known application errors ──────────────────────────────────────────────
  if (err instanceof AppError) {
    const level = err.statusCode >= 500 ? "error" : "warn";
    console[level](
      JSON.stringify({
        level,
        requestId,
        error: err.code,
        message: err.message,
        statusCode: err.statusCode,
        timestamp,
      })
    );

    return c.json(
      {
        success: false,
        error: {
          code: err.code,
          message: err.message,
          ...(err.details !== undefined && { details: err.details }),
        },
        requestId,
        timestamp,
      },
      err.statusCode as Parameters<typeof c.json>[1]
    );
  }

  // ── Unexpected errors ─────────────────────────────────────────────────────
  console.error(
    JSON.stringify({
      level: "error",
      requestId,
      error: "INTERNAL_ERROR",
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      timestamp,
    })
  );

  return c.json(
    {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred. Please try again later.",
      },
      requestId,
      timestamp,
    },
    500
  );
};
