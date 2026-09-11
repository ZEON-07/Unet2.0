/**
 * Search lookup repository – Phase 4 extended version.
 *
 * Handles both the admin list view (GET /api/admin/search-lookups)
 * and the Phase 4 pipeline (insert + update).
 */

import { desc, eq, sql } from "drizzle-orm";
import type { DrizzleDb } from "./db";
import { searchLookups, penModels, penBrands } from "../../drizzle/schema";
import type { NewSearchLookup } from "../../drizzle/schema";

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
 * Call this before hitting the provider so the record exists even if the
 * provider throws (we can update it to status = 'failed').
 */
export async function insertSearchLookup(
  db: DrizzleDb,
  data: Omit<NewSearchLookup, "searchedAt">
) {
  return db.insert(searchLookups).values(data).returning().get();
}

/**
 * Update a search lookup record after the pipeline completes.
 */
export async function updateSearchLookup(
  db: DrizzleDb,
  id: string,
  patch: {
    status?: "completed" | "failed" | "cached";
    resultCount?: number;
    rawResult?: string;
    pendingClaimsCreated?: number;
    penModelId?: string | null;
    message?: string;
  }
) {
  return db
    .update(searchLookups)
    .set(patch)
    .where(eq(searchLookups.id, id))
    .returning()
    .get();
}

// ─── Cache helpers ────────────────────────────────────────────────────────────

/** 30-day TTL in seconds for the KV search cache */
export const SEARCH_CACHE_TTL_SECONDS = 60 * 60 * 24 * 30;

/** Build the KV cache key from a normalized query string */
export function buildCacheKey(normalizedQuery: string): string {
  return `search_cache:${normalizedQuery}`;
}

// ─── List (admin view) ────────────────────────────────────────────────────────

/**
 * Paginated list of search lookup records with joined pen model / brand names.
 */
export async function listSearchLookups(
  db: DrizzleDb,
  limit: number,
  offset: number
): Promise<{ rows: SearchLookupRow[]; total: number }> {
  const rows = await db
    .select({
      id: searchLookups.id,
      query: searchLookups.query,
      penModelId: searchLookups.penModelId,
      penModelName: penModels.name,
      brandName: penBrands.name,
      resultCount: searchLookups.resultCount,
      clientIpHash: searchLookups.clientIpHash,
      searchedAt: searchLookups.searchedAt,
      status: searchLookups.status,
      pendingClaimsCreated: searchLookups.pendingClaimsCreated,
      brand: searchLookups.brand,
      model: searchLookups.model,
      cacheHit: searchLookups.cacheHit,
      message: searchLookups.message,
    })
    .from(searchLookups)
    .leftJoin(penModels, eq(searchLookups.penModelId, penModels.id))
    .leftJoin(penBrands, eq(penModels.brandId, penBrands.id))
    .orderBy(desc(searchLookups.searchedAt))
    .limit(limit)
    .offset(offset)
    .all() as unknown as SearchLookupRow[];

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(searchLookups)
    .get();

  return { rows, total: countResult?.count ?? 0 };
}
