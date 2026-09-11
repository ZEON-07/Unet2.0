/**
 * Prediction repository – D1 persistence for prediction records.
 */

import { desc, eq } from "drizzle-orm";
import type { DrizzleDb } from "./db";
import { penClaims, penSources, predictions } from "../../drizzle/schema";
import type { NewPrediction } from "../../drizzle/schema";

/** Insert a new prediction row and return the full record. */
export async function insertPrediction(
  db: DrizzleDb,
  data: NewPrediction
) {
  return db.insert(predictions).values(data).returning().get();
}

/** Fetch a prediction by its UUID. */
export async function findPredictionById(
  db: DrizzleDb,
  id: string
) {
  return db
    .select()
    .from(predictions)
    .where(eq(predictions.id, id))
    .get();
}

/**
 * Try to fetch a source for a pen model.
 * Looks for the most recent claim for that model that has a linked source,
 * returning the source title, url, and the claim's createdAt as checkedAt.
 */
export async function findSourceForPenModel(
  db: DrizzleDb,
  penModelId: string
): Promise<{ title: string; url: string | null; checkedAt: string } | null> {
  const row = await db
    .select({
      title: penSources.name,
      url: penSources.url,
      checkedAt: penClaims.createdAt,
    })
    .from(penClaims)
    .innerJoin(penSources, eq(penClaims.sourceId, penSources.id))
    .where(eq(penClaims.penModelId, penModelId))
    .orderBy(desc(penClaims.isVerified), desc(penClaims.createdAt))
    .get();

  return row ?? null;
}
