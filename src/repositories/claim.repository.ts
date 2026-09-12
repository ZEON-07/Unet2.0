/**
 * Claim repository – pending claim queries for the admin panel.
 */

import { prisma } from "../lib/prisma";
import type { PrismaClient } from "@prisma/client";

function getClient(db?: unknown): PrismaClient {
  return (db && typeof db === "object" && "penClaim" in db ? db : prisma) as PrismaClient;
}

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
export async function findPendingClaims(db?: unknown): Promise<PendingClaimRow[]> {
  const client = getClient(db);

  const claims = await client.penClaim.findMany({
    where: {
      isVerified: false,
    },
    include: {
      penModel: {
        include: {
          brand: true,
        },
      },
      user: true,
      source: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return claims.map((c) => ({
    id: c.id,
    penModelId: c.penModelId,
    penModelName: c.penModel?.name ?? "",
    brandName: c.penModel?.brand?.name ?? "",
    userId: c.userId,
    userEmail: c.user?.email ?? "",
    sourceId: c.sourceId,
    sourceName: c.source?.name ?? null,
    sourceUrl: c.source?.url ?? null,
    purchasedAt: c.purchasedAt,
    mileageClaimed: c.mileageClaimed,
    inkFlowRating: c.inkFlowRating,
    notes: c.notes,
    isVerified: c.isVerified,
    createdAt:
      c.createdAt instanceof Date ? c.createdAt.toISOString() : String(c.createdAt),
    updatedAt:
      c.updatedAt instanceof Date ? c.updatedAt.toISOString() : String(c.updatedAt),
  }));
}

/** Find a single claim by its UUID. */
export async function findClaimById(db: unknown, id?: string) {
  const actualId = typeof db === "string" ? db : id!;
  const client = getClient(db);
  return client.penClaim.findUnique({
    where: { id: actualId },
  });
}

/**
 * Update a claim's isVerified status and optionally its notes.
 */
export async function updateClaim(
  db: unknown,
  id: string,
  patch?: { isVerified: boolean; notes?: string }
) {
  const actualId = typeof db === "string" && !patch ? db : id;
  const actualPatch = typeof db === "string" && !patch ? (id as any) : patch!;
  const client = getClient(db);

  return client.penClaim.update({
    where: { id: actualId },
    data: {
      isVerified: actualPatch.isVerified,
      ...(actualPatch.notes !== undefined && { notes: actualPatch.notes }),
    },
  });
}
