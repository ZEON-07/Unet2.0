/**
 * Admin request validators.
 */

import { z } from "zod";
import {
  FlowCategoryEnum,
  BarrelVisibilityEnum,
  paginationSchema,
  idSchema,
} from "./common";

// ─── Path params ──────────────────────────────────────────────────────────────

export const claimIdParamSchema = z.object({
  claimId: z.string().min(1, "claimId is required"),
});

export const adminPenIdParamSchema = z.object({
  penId: z.string().min(1, "penId is required"),
});

// ─── PATCH /api/admin/claims/:claimId ────────────────────────────────────────

export const patchClaimBodySchema = z.object({
  /** Set to true to verify (approve) the claim, false to reject */
  isVerified: z.boolean(),
  /** Optional admin note stored with the update */
  notes: z.string().max(1000).optional(),
});

export type PatchClaimBody = z.infer<typeof patchClaimBodySchema>;

// ─── POST /api/admin/pens ─────────────────────────────────────────────────────

export const createPenBodySchema = z.object({
  /**
   * Either supply an existing brandId or supply brandName (+ optional brandSlug
   * and brandCountry) to create a new brand on the fly.
   */
  brandId: idSchema.optional(),
  brandName: z.string().min(1).max(100).optional(),
  brandSlug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens")
    .optional(),
  brandCountry: z.string().length(2).optional(),

  /** Pen model fields */
  name: z.string().min(1, "name is required").max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens")
    .optional(),
  flowCategory: FlowCategoryEnum,
  barrelVisibility: BarrelVisibilityEnum,
  nominalMileageM: z.number().positive().optional(),
  imageUrl: z.string().url().optional(),
  description: z.string().max(2000).optional(),
}).refine(
  (d) => d.brandId !== undefined || d.brandName !== undefined,
  { message: "Provide either brandId or brandName", path: ["brandId"] }
);

export type CreatePenBody = z.infer<typeof createPenBodySchema>;

// ─── PATCH /api/admin/pens/:penId ────────────────────────────────────────────

export const patchPenBodySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  flowCategory: FlowCategoryEnum.optional(),
  barrelVisibility: BarrelVisibilityEnum.optional(),
  nominalMileageM: z.number().positive().nullable().optional(),
  communityMileageM: z.number().positive().nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  isActive: z.boolean().optional(),
}).refine(
  (d) => Object.values(d).some((v) => v !== undefined),
  { message: "At least one field must be provided for update" }
);

export type PatchPenBody = z.infer<typeof patchPenBodySchema>;

// ─── GET /api/admin/search-lookups ───────────────────────────────────────────

export const searchLookupQuerySchema = paginationSchema;
export type SearchLookupQuery = z.infer<typeof searchLookupQuerySchema>;
