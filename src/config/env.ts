import { z } from "zod";
import type { Bindings } from "../types/bindings";

/**
 * Runtime environment validation.
 * Call this once at Worker startup (in the fetch handler) to fail fast
 * if required secrets are missing.
 */
export function validateEnv(env: Bindings): void {
  const schema = z.object({
    JWT_SECRET: z
      .string()
      .min(16, "JWT_SECRET must be at least 16 characters"),
    CORS_ORIGIN: z.string().url("CORS_ORIGIN must be a valid URL"),
    ENVIRONMENT: z.enum(["development", "staging", "production"]),
  });

  const result = schema.safeParse(env);
  if (!result.success) {
    const issues = result.error.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");
    throw new Error(`[InkLife] Invalid environment configuration: ${issues}`);
  }
}

/**
 * Parse admin emails from the ADMIN_EMAILS comma-separated binding.
 */
export function getAdminEmails(env: Bindings): string[] {
  return (env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}
