/**
 * Search lookup repository – Prisma version.
 *
 * Handles both the admin list view (GET /api/admin/search-lookups)
 * and the Phase 4 pipeline (insert + update).
 */

import { prisma } from "../lib/prisma";
import type { PrismaClient } from "@prisma/client";

function getClient(db?: unknown): PrismaClient {
  return (db && typeof db === "object" && "searchLookup" in db ? db : prisma) as PrismaClient;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type SearchLookupRow = {
  id: string;
  query: string;
  penModelId: string | null;
  penModelName: string | null;
  brandName: string | null;
  resultCount: number;
  clientIpHash: string | null;
  searchedAt: string;
  status: string;
  pendingClaimsCreated: number;
  brand: string | null;
  model: string | null;
  cacheHit: boolean;
  message: string | null;
};

// ─── Insert / Update ──────────────────────────────────────────────────────────

/**
 * Create a new search lookup record.
 */
export async function insertSearchLookup(
  db: unknown,
  data?: any
) {
  const payload = typeof db === "object" && data === undefined ? db : data;
  const client = getClient(db);
  return client.searchLookup.create({
    data: payload,
  });
}

/**
 * Update a search lookup record after the pipeline completes.
 */
export async function updateSearchLookup(
  db: unknown,
  id: string,
  patch?: {
    status?: string;
    resultCount?: number;
    rawResult?: string;
    pendingClaimsCreated?: number;
    penModelId?: string | null;
    message?: string;
  }
) {
  const actualId = typeof db === "string" && !patch ? db : id;
  const actualPatch = typeof db === "string" && !patch ? (id as any) : patch!;
  const client = getClient(db);

  return client.searchLookup.update({
    where: { id: actualId },
    data: actualPatch,
  });
}

// ─── Cache helpers ────────────────────────────────────────────────────────────

/** 30-day TTL in seconds for the search cache */
export const SEARCH_CACHE_TTL_SECONDS = 60 * 60 * 24 * 30;

/** Build the cache key from a normalized query string */
export function buildCacheKey(normalizedQuery: string): string {
  return `search_cache:${normalizedQuery}`;
}

// ─── List (admin view) ────────────────────────────────────────────────────────

/**
 * Paginated list of search lookup records with joined pen model / brand names.
 */
export async function listSearchLookups(
  db: unknown,
  limit = 20,
  offset = 0
): Promise<{ rows: SearchLookupRow[]; total: number }> {
  const client = getClient(db);

  const [lookups, total] = await Promise.all([
    client.searchLookup.findMany({
      include: {
        penModel: {
          include: {
            brand: true,
          },
        },
      },
      orderBy: {
        searchedAt: "desc",
      },
      skip: offset,
      take: limit,
    }),
    client.searchLookup.count(),
  ]);

  const rows: SearchLookupRow[] = lookups.map((l) => ({
    id: l.id,
    query: l.query,
    penModelId: l.penModelId,
    penModelName: l.penModel?.name ?? null,
    brandName: l.penModel?.brand?.name ?? null,
    resultCount: l.resultCount,
    clientIpHash: l.clientIpHash,
    searchedAt:
      l.searchedAt instanceof Date ? l.searchedAt.toISOString() : String(l.searchedAt),
    status: l.status,
    pendingClaimsCreated: l.pendingClaimsCreated,
    brand: l.brand,
    model: l.model,
    cacheHit: l.cacheHit,
    message: l.message,
  }));

  return { rows, total };
}
