/**
 * Prediction repository – Prisma persistence for prediction records.
 */

import { prisma } from "../lib/prisma";
import type { PrismaClient } from "@prisma/client";

function getClient(db?: unknown): PrismaClient {
  return (db && typeof db === "object" && "prediction" in db ? db : prisma) as PrismaClient;
}

/** Insert a new prediction row and return the full record. */
export async function insertPrediction(
  db: unknown,
  data?: any
) {
  const payload = typeof db === "object" && data === undefined ? db : data;
  const client = getClient(db);
  return client.prediction.create({
    data: payload,
  });
}

/** Fetch a prediction by its UUID. */
export async function findPredictionById(
  db: unknown,
  id?: string
) {
  const actualId = typeof db === "string" ? db : id!;
  const client = getClient(db);
  return client.prediction.findUnique({
    where: { id: actualId },
  });
}

/**
 * Try to fetch a source for a pen model.
 * Looks for the most recent claim for that model that has a linked source,
 * returning the source title, url, and the claim's createdAt as checkedAt.
 */
export async function findSourceForPenModel(
  db: unknown,
  penModelId?: string
): Promise<{ title: string; url: string | null; checkedAt: string } | null> {
  const actualId = typeof db === "string" ? db : penModelId!;
  const client = getClient(db);

  const claim = await client.penClaim.findFirst({
    where: {
      penModelId: actualId,
      sourceId: { not: null },
    },
    include: {
      source: true,
    },
    orderBy: [
      { isVerified: "desc" },
      { createdAt: "desc" },
    ],
  });

  if (!claim || !claim.source) return null;

  return {
    title: claim.source.name,
    url: claim.source.url,
    checkedAt:
      claim.createdAt instanceof Date
        ? claim.createdAt.toISOString()
        : String(claim.createdAt),
  };
}
