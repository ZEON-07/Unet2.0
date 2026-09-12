import { z } from "zod";

// ─── Common field validators ─────────────────────────────────────────────────

export const idSchema = z.string().min(1, "ID is required");

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

// ─── Required Zod Enums for SQLite ───────────────────────────────────────────

export const confidenceSchema = z.enum([
  "high",
  "medium",
  "low",
  "very_high",
]);

export const writingStyleSchema = z.enum([
  "light",
  "normal",
  "heavy",
]);

export const notebookTypeSchema = z.enum([
  "long_book",
  "queen_book",
  "king_book",
]);

export const barrelVisibilitySchema = z.enum([
  "transparent",
  "visible_refill",
  "opaque",
  "semi_transparent",
  "unknown",
]);

export const flowCategorySchema = z.enum([
  "low_flow",
  "normal_ballpoint",
  "smooth_low_viscosity",
  "gel",
  "liquid_rollerball",
  "fiber_tip",
  "felt_tip",
]);

export const FlowCategoryEnum = flowCategorySchema;
export const BarrelVisibilityEnum = barrelVisibilitySchema;
export const ConfidenceEnum = confidenceSchema;
export const SourceTypeEnum = z.enum(["online", "offline", "hybrid"]);
export const UserRoleEnum = z.enum(["user", "admin"]);

// ─── TypeScript types derived from Zod ───────────────────────────────────────

export type FlowCategory = z.infer<typeof flowCategorySchema>;
export type BarrelVisibility = z.infer<typeof barrelVisibilitySchema>;
export type SourceType = z.infer<typeof SourceTypeEnum>;
export type Confidence = z.infer<typeof confidenceSchema>;
export type UserRole = z.infer<typeof UserRoleEnum>;
export type Pagination = z.infer<typeof paginationSchema>;
