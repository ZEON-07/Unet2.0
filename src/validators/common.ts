import { z } from "zod";

// ─── Common field validators ─────────────────────────────────────────────────

export const idSchema = z.string().uuid("ID must be a valid UUID");

export const slugSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only");

export const emailSchema = z.string().email("Must be a valid email address");

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ─── Enums ────────────────────────────────────────────────────────────────────

export const FlowCategoryEnum = z.enum([
  "normal_ballpoint",
  "liquid_rollerball",
  "smooth_low_viscosity",
  "gel",
  "fiber_tip",
  "felt_tip",
]);

export const BarrelVisibilityEnum = z.enum([
  "transparent",
  "visible_refill",
  "opaque",
  "semi_transparent",
]);

export const SourceTypeEnum = z.enum(["online", "offline", "hybrid"]);

export const ConfidenceEnum = z.enum(["low", "medium", "high", "very_high"]);

export const UserRoleEnum = z.enum(["user", "admin"]);

// ─── TypeScript types derived from Zod ───────────────────────────────────────

export type FlowCategory = z.infer<typeof FlowCategoryEnum>;
export type BarrelVisibility = z.infer<typeof BarrelVisibilityEnum>;
export type SourceType = z.infer<typeof SourceTypeEnum>;
export type Confidence = z.infer<typeof ConfidenceEnum>;
export type UserRole = z.infer<typeof UserRoleEnum>;
export type Pagination = z.infer<typeof paginationSchema>;
