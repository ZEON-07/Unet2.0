/**
 * Shared zValidator wrapper.
 * Passes Zod errors through a custom hook so they return the standard
 * { success: false, error: { code, message, details } } envelope
 * with status 422 (instead of zod-validator's raw 400).
 */

import { zValidator as honoZValidator } from "@hono/zod-validator";
import type { ZodSchema } from "zod";
import type { ValidationTargets } from "hono";

type Target = keyof ValidationTargets;

export function zValidator<T extends ZodSchema, TTarget extends Target>(
  target: TTarget,
  schema: T
) {
  return honoZValidator(target, schema, (result, c) => {
    if (!result.success) {
      const issues = result.error.errors.map((e) => ({
        path: e.path.join("."),
        message: e.message,
        code: e.code,
      }));

      // Grab requestId from the request header (set by requestId middleware before routing)
      const requestId = c.req.header("X-Request-Id") ?? "unknown";

      return c.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Request validation failed",
            details: issues,
          },
          requestId,
          timestamp: new Date().toISOString(),
        } as const,
        422 as const
      );
    }
    return undefined;
  });
}
