/**
 * Claim repository – pending claim queries for the admin panel.
 */

import { desc, eq } from "drizzle-orm";
import type { DrizzleDb } from "./db";
import { penClaims, penModels, penBrands, penSources, users } from "../../drizzle/schema";

export type PendingClaimRow = {
  id: string;
  penModelId: string;
  penModelName: string;
  brandName: string;
  userId: string;
  userEmail: string;
  sourceId: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  purchasedAt: string | null;
  mileageClaimed: number | null;
  inkFlowRating: number | null;
  notes: string | null;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

/**
 * Fetch all unverified claims joined with pen model, brand, user, and source info.
 */
export async function findPendingClaims(db: DrizzleDb): Promise<PendingClaimRow[]> {
  const rows = await db
    .select({
      id: penClaims.id,
      penModelId: penClaims.penModelId,
      penModelName: penModels.name,
      brandName: penBrands.name,
      userId: penClaims.userId,
      userEmail: users.email,
      sourceId: penClaims.sourceId,
      sourceName: penSources.name,
      sourceUrl: penSources.url,
      purchasedAt: penClaims.purchasedAt,
      mileageClaimed: penClaims.mileageClaimed,
      inkFlowRating: penClaims.inkFlowRating,
      notes: penClaims.notes,
      isVerified: penClaims.isVerified,
      createdAt: penClaims.createdAt,
      updatedAt: penClaims.updatedAt,
    })
    .from(penClaims)
    .innerJoin(penModels, eq(penClaims.penModelId, penModels.id))
    .innerJoin(penBrands, eq(penModels.brandId, penBrands.id))
    .innerJoin(users, eq(penClaims.userId, users.id))
    .leftJoin(penSources, eq(penClaims.sourceId, penSources.id))
    .where(eq(penClaims.isVerified, false))
    .orderBy(desc(penClaims.createdAt))
    .all() as unknown as PendingClaimRow[];

  return rows;
}

/** Find a single claim by its UUID. */
export async function findClaimById(db: DrizzleDb, id: string) {
  return db
    .select()
    .from(penClaims)
    .where(eq(penClaims.id, id))
    .get();
}

/**
 * Update a claim's isVerified status and optionally its notes.
 */
export async function updateClaim(
  db: DrizzleDb,
  id: string,
  patch: { isVerified: boolean; notes?: string }
) {
  const updatedAt = new Date().toISOString();
  return db
    .update(penClaims)
    .set({
      isVerified: patch.isVerified,
      ...(patch.notes !== undefined && { notes: patch.notes }),
      updatedAt,
    })
    .where(eq(penClaims.id, id))
    .returning()
    .get();
}
