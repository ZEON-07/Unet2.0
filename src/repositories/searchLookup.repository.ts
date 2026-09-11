/**
 * Search lookup repository – list recent search lookup records.
 */

import { desc, eq, sql } from "drizzle-orm";
import type { DrizzleDb } from "./db";
import { searchLookups, penModels, penBrands } from "../../drizzle/schema";

export type SearchLookupRow = {
  id: string;
  query: string;
  penModelId: string | null;
  penModelName: string | null;
  brandName: string | null;
  resultCount: number;
  clientIpHash: string | null;
  searchedAt: string;
};

/**
 * Paginated list of search lookup records, newest first.
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
