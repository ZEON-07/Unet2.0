/**
 * Pen repository – Prisma queries for pen models with joins.
 */

import { prisma } from "../lib/prisma";
import type { PrismaClient } from "@prisma/client";
import type { PenSearchQuery } from "../validators/pen.validators";

function getClient(db?: unknown): PrismaClient {
  return (db && typeof db === "object" && "penModel" in db ? db : prisma) as PrismaClient;
}

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

export type PenClaimInfo = {
  id: string;
  sourceName: string;
  sourceUrl: string | null;
  mileageClaimed: number;
  isVerified: boolean;
  notes: string | null;
  createdAt: string;
};

// ─── Helper mapping ───────────────────────────────────────────────────────────

function mapModelRow(model: any): PenModelRow {
  return {
    id: model.id,
    name: model.name,
    slug: model.slug,
    flowCategory: model.flowCategory ?? "normal_ballpoint",
    barrelVisibility: model.barrelVisibility ?? "unknown",
    nominalMileageM: model.nominalMileageM,
    communityMileageM: model.communityMileageM,
    imageUrl: model.imageUrl,
    description: model.description,
    isActive: model.isActive,
    brandId: model.brandId,
    brandName: model.brand?.name ?? "",
    brandSlug: model.brand?.slug ?? "",
    createdAt: model.createdAt instanceof Date ? model.createdAt.toISOString() : String(model.createdAt),
    updatedAt: model.updatedAt instanceof Date ? model.updatedAt.toISOString() : String(model.updatedAt),
  };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Fetch all active models for a given brand ID, ordered by name.
 */
export async function findModelsByBrandId(
  db: unknown,
  brandId?: string
): Promise<PenModelRow[]> {
  const actualBrandId = typeof db === "string" ? db : brandId!;
  const client = getClient(db);

  const rows = await client.penModel.findMany({
    where: {
      brandId: actualBrandId,
      isActive: true,
    },
    include: {
      brand: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return rows.map(mapModelRow);
}

/**
 * Find a single pen model by its UUID or slug, joined with brand.
 */
export async function findPenByIdOrSlug(
  db: unknown,
  idOrSlug?: string
): Promise<PenModelRow | undefined> {
  const actual = typeof db === "string" ? db : idOrSlug!;
  const client = getClient(db);

  const model = await client.penModel.findFirst({
    where: {
      OR: [{ id: actual }, { slug: actual }],
    },
    include: {
      brand: true,
    },
  });

  if (!model) return undefined;
  return mapModelRow(model);
}

/**
 * Search pen models with optional filters and pagination.
 * Returns { rows, total }.
 */
export async function searchPens(
  db: unknown,
  params?: PenSearchQuery
): Promise<{ rows: PenModelRow[]; total: number }> {
  const actualParams =
    db && typeof db === "object" && !("penModel" in db)
      ? (db as PenSearchQuery)
      : params!;
  const client = getClient(db);

  const { q, brand, inkType, barrelVisibility, page = 1, limit = 20 } = actualParams || {};
  const skip = (page - 1) * limit;

  const where: any = {
    isActive: true,
  };

  if (q) {
    where.OR = [
      { name: { contains: q } },
      { brand: { name: { contains: q } } },
    ];
  }

  if (brand) {
    where.brand = {
      OR: [
        { slug: brand },
        { name: { contains: brand } },
      ],
    };
  }

  if (inkType) {
    where.flowCategory = inkType;
  }

  if (barrelVisibility) {
    where.barrelVisibility = barrelVisibility;
  }

  const [rows, total] = await Promise.all([
    client.penModel.findMany({
      where,
      include: {
        brand: true,
      },
      orderBy: {
        name: "asc",
      },
      skip,
      take: limit,
    }),
    client.penModel.count({ where }),
  ]);

  return {
    rows: rows.map(mapModelRow),
    total,
  };
}

/**
 * Get the latest prediction for a pen model.
 */
export async function findLatestPrediction(
  db: unknown,
  penModelId?: string
): Promise<PredictionRow | undefined> {
  const actualId = typeof db === "string" ? db : penModelId!;
  const client = getClient(db);

  const pred = await client.prediction.findFirst({
    where: {
      penModelId: actualId,
    },
    orderBy: {
      computedAt: "desc",
    },
  });

  if (!pred) return undefined;

  return {
    id: pred.id,
    penModelId: pred.penModelId ?? "",
    predictedMileageM: pred.predictedMileageM,
    confidence: pred.confidence,
    modelVersion: pred.modelVersion,
    sampleSize: pred.sampleSize,
    computedAt:
      pred.computedAt instanceof Date
        ? pred.computedAt.toISOString()
        : String(pred.computedAt),
  };
}

/**
 * Find a pen model by brand ID and a fuzzy model name match.
 */
export async function findPenByBrandAndName(
  db: unknown,
  brandId: string,
  modelName?: string
) {
  const actualModelName = typeof brandId === "string" && modelName ? modelName : "";
  const actualBrandId = brandId;
  const client = getClient(db);

  return client.penModel.findFirst({
    where: {
      brandId: actualBrandId,
      name: {
        contains: actualModelName,
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });
}

/**
 * Fetch all claims associated with a pen model, ordered by verified status then recency.
 */
export async function findClaimsForPenModel(
  db: unknown,
  penModelId?: string
): Promise<PenClaimInfo[]> {
  const actualId = typeof db === "string" ? db : penModelId!;
  const client = getClient(db);

  const claims = await client.penClaim.findMany({
    where: {
      penModelId: actualId,
    },
    include: {
      source: true,
    },
    orderBy: [
      { isVerified: "desc" },
      { createdAt: "desc" },
    ],
  });

  return claims.map((c) => ({
    id: c.id,
    sourceName: c.source?.name ?? "Unknown Source",
    sourceUrl: c.source?.url ?? null,
    mileageClaimed: c.mileageClaimed ?? 0,
    isVerified: c.isVerified,
    notes: c.notes,
    createdAt:
      c.createdAt instanceof Date ? c.createdAt.toISOString() : String(c.createdAt),
  }));
}
