/**
 * Pen repository – D1 queries for pen models with joins.
 *
 * D1/SQLite quirks:
 *  - No array aggregation → we do separate queries for claims/predictions
 *    rather than GROUP BY + JSON_GROUP_ARRAY (poor Workers support)
 *  - LIKE is case-insensitive for ASCII by default in SQLite
 *  - LIMIT/OFFSET for pagination
 */

import { and, asc, eq, like, or, sql } from "drizzle-orm";
import type { DrizzleDb } from "./db";
import { penBrands, penModels, predictions } from "../../drizzle/schema";
import type { PenSearchQuery } from "../validators/pen.validators";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PenModelRow = {
  id: string;
  name: string;
  slug: string;
  flowCategory: string;
  barrelVisibility: string;
  nominalMileageM: number | null;
  communityMileageM: number | null;
  imageUrl: string | null;
  description: string | null;
  isActive: boolean;
  brandId: string;
  brandName: string;
  brandSlug: string;
  createdAt: string;
  updatedAt: string;
};

export type PredictionRow = {
  id: string;
  penModelId: string;
  predictedMileageM: number;
  confidence: string;
  modelVersion: string;
  sampleSize: number;
  computedAt: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Shared select projection joining penModels + penBrands. */
const modelWithBrandSelect = {
  id: penModels.id,
  name: penModels.name,
  slug: penModels.slug,
  flowCategory: penModels.flowCategory,
  barrelVisibility: penModels.barrelVisibility,
  nominalMileageM: penModels.nominalMileageM,
  communityMileageM: penModels.communityMileageM,
  imageUrl: penModels.imageUrl,
  description: penModels.description,
  isActive: penModels.isActive,
  brandId: penModels.brandId,
  brandName: penBrands.name,
  brandSlug: penBrands.slug,
  createdAt: penModels.createdAt,
  updatedAt: penModels.updatedAt,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Fetch all active models for a given brand ID, ordered by name.
 */
export async function findModelsByBrandId(
  db: DrizzleDb,
  brandId: string
): Promise<PenModelRow[]> {
  return db
    .select(modelWithBrandSelect)
    .from(penModels)
    .innerJoin(penBrands, eq(penModels.brandId, penBrands.id))
    .where(and(eq(penModels.brandId, brandId), eq(penModels.isActive, true)))
    .orderBy(asc(penModels.name))
    .all() as unknown as PenModelRow[];
}

/**
 * Find a single pen model by its UUID or slug, joined with brand.
 */
export async function findPenByIdOrSlug(
  db: DrizzleDb,
  idOrSlug: string
): Promise<PenModelRow | undefined> {
  return db
    .select(modelWithBrandSelect)
    .from(penModels)
    .innerJoin(penBrands, eq(penModels.brandId, penBrands.id))
    .where(
      or(eq(penModels.id, idOrSlug), eq(penModels.slug, idOrSlug))
    )
    .get() as unknown as PenModelRow | undefined;
}

/**
 * Search pen models with optional filters and pagination.
 * Returns [rows, totalCount].
 */
export async function searchPens(
  db: DrizzleDb,
  params: PenSearchQuery
): Promise<{ rows: PenModelRow[]; total: number }> {
  const { q, brand, inkType, barrelVisibility, page, limit } = params;
  const offset = (page - 1) * limit;

  // Build WHERE conditions
  const conditions = [eq(penModels.isActive, true)];

  if (q) {
    const pattern = `%${q}%`;
    conditions.push(
      or(
        like(penModels.name, pattern),
        like(penBrands.name, pattern)
      ) as ReturnType<typeof eq>
    );
  }

  if (brand) {
    const pattern = `%${brand}%`;
    conditions.push(
      or(
        like(penBrands.slug, brand),     // exact slug match
        like(penBrands.name, pattern)    // partial name match
      ) as ReturnType<typeof eq>
    );
  }

  if (inkType) {
    conditions.push(eq(penModels.flowCategory, inkType));
  }

  if (barrelVisibility) {
    conditions.push(eq(penModels.barrelVisibility, barrelVisibility));
  }

  const where = and(...conditions);

  // Main paginated query
  const rows = await db
    .select(modelWithBrandSelect)
    .from(penModels)
    .innerJoin(penBrands, eq(penModels.brandId, penBrands.id))
    .where(where)
    .orderBy(asc(penModels.name))
    .limit(limit)
    .offset(offset)
    .all() as PenModelRow[];

  // Count query (separate, D1 doesn't support window COUNT efficiently)
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(penModels)
    .innerJoin(penBrands, eq(penModels.brandId, penBrands.id))
    .where(where)
    .get();

  return { rows, total: countResult?.count ?? 0 };
}

/**
 * Get the latest prediction for a pen model.
 */
export async function findLatestPrediction(
  db: DrizzleDb,
  penModelId: string
): Promise<PredictionRow | undefined> {
  return db
    .select({
      id: predictions.id,
      penModelId: predictions.penModelId,
      predictedMileageM: predictions.predictedMileageM,
      confidence: predictions.confidence,
      modelVersion: predictions.modelVersion,
      sampleSize: predictions.sampleSize,
      computedAt: predictions.computedAt,
    })
    .from(predictions)
    .where(eq(predictions.penModelId, penModelId))
    .orderBy(sql`${predictions.computedAt} DESC`)
    .get() as unknown as PredictionRow | undefined;
}
