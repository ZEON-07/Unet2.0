import { z } from "zod";
import {
  FlowCategoryEnum,
  BarrelVisibilityEnum,
  paginationSchema,
} from "./common";

// ─── Path Params ──────────────────────────────────────────────────────────────

export const brandIdParamSchema = z.object({
  brandId: z.string().min(1, "brandId is required"),
});

export const penIdParamSchema = z.object({
  penId: z.string().min(1, "penId is required"),
});

// ─── Query Params ─────────────────────────────────────────────────────────────

/** GET /api/pens/search query parameters */
export const penSearchQuerySchema = paginationSchema.extend({
  /** Free-text search in model name or brand name */
  q: z.string().max(200).optional(),
  /** Filter by brand slug or brand name (case-insensitive) */
  brand: z.string().max(100).optional(),
  /** Filter by flow category (ink type) */
  inkType: FlowCategoryEnum.optional(),
  /** Filter by barrel visibility */
  barrelVisibility: BarrelVisibilityEnum.optional(),
});

export type PenSearchQuery = z.infer<typeof penSearchQuerySchema>;
