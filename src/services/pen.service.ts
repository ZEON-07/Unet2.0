/**
 * Pen service – business logic for pen model endpoints.
 *
 * Shapes raw DB rows into the API response DTOs.
 */

import type { DrizzleDb } from "../repositories/db";
import * as penRepo from "../repositories/pen.repository";
import * as brandRepo from "../repositories/brand.repository";
import type { PenModelRow, PredictionRow } from "../repositories/pen.repository";
import { NotFoundError } from "../utils/errors";
import type { PenSearchQuery } from "../validators/pen.validators";

// ─── Response DTOs ────────────────────────────────────────────────────────────

export type BrandDto = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  countryOfOrigin: string | null;
};

export type ClaimSummaryDto = {
  writingLengthMeters: number;
  confidence: string;
  modelVersion: string;
  sampleSize: number;
  computedAt: string;
} | null;

export type PenModelSummaryDto = {
  id: string;
  name: string;
  slug: string;
  flowCategory: string;
  barrelVisibility: string;
  nominalMileageM: number | null;
  brand: Pick<BrandDto, "id" | "name" | "slug">;
  claimSummary: ClaimSummaryDto;
};

export type PenModelDetailDto = PenModelSummaryDto & {
  communityMileageM: number | null;
  imageUrl: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedResult<T> = {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

// ─── Mappers ──────────────────────────────────────────────────────────────────

function mapClaimSummary(pred: PredictionRow | undefined): ClaimSummaryDto {
  if (!pred) return null;
  return {
    writingLengthMeters: pred.predictedMileageM,
    confidence: pred.confidence,
    modelVersion: pred.modelVersion,
    sampleSize: pred.sampleSize,
    computedAt: pred.computedAt,
  };
}

function mapPenSummary(
  row: PenModelRow,
  claimSummary: ClaimSummaryDto
): PenModelSummaryDto {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    flowCategory: row.flowCategory,
    barrelVisibility: row.barrelVisibility,
    nominalMileageM: row.nominalMileageM,
    brand: { id: row.brandId, name: row.brandName, slug: row.brandSlug },
    claimSummary,
  };
}

function mapPenDetail(
  row: PenModelRow,
  claimSummary: ClaimSummaryDto
): PenModelDetailDto {
  return {
    ...mapPenSummary(row, claimSummary),
    communityMileageM: row.communityMileageM,
    imageUrl: row.imageUrl,
    description: row.description,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// ─── Service functions ────────────────────────────────────────────────────────

/**
 * GET /api/brands/:brandId/models
 * Validates brand exists, returns all active models with claim summaries.
 */
export async function getModelsByBrand(
  db: DrizzleDb,
  brandIdOrSlug: string
): Promise<PenModelSummaryDto[]> {
  const brand = await brandRepo.findBrandByIdOrSlug(db, brandIdOrSlug);
  if (!brand) throw new NotFoundError("PenBrand", brandIdOrSlug);

  const rows = await penRepo.findModelsByBrandId(db, brand.id);

  // Fetch predictions in parallel
  const withPredictions = await Promise.all(
    rows.map(async (row) => {
      const pred = await penRepo.findLatestPrediction(db, row.id);
      return mapPenSummary(row, mapClaimSummary(pred));
    })
  );

  return withPredictions;
}

/**
 * GET /api/pens/search
 * Paginated search with filters.
 */
export async function searchPens(
  db: DrizzleDb,
  query: PenSearchQuery
): Promise<PaginatedResult<PenModelSummaryDto>> {
  const { rows, total } = await penRepo.searchPens(db, query);
  const { page, limit } = query;
  const totalPages = Math.ceil(total / limit);

  const withPredictions = await Promise.all(
    rows.map(async (row) => {
      const pred = await penRepo.findLatestPrediction(db, row.id);
      return mapPenSummary(row, mapClaimSummary(pred));
    })
  );

  return {
    items: withPredictions,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/**
 * GET /api/pens/:penId
 * Full detail for a single pen model. Throws 404 if not found.
 */
export async function getPenDetail(
  db: DrizzleDb,
  idOrSlug: string
): Promise<PenModelDetailDto> {
  const row = await penRepo.findPenByIdOrSlug(db, idOrSlug);
  if (!row) throw new NotFoundError("PenModel", idOrSlug);

  const pred = await penRepo.findLatestPrediction(db, row.id);
  return mapPenDetail(row, mapClaimSummary(pred));
}
