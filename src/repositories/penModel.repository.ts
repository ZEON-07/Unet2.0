/**
 * PenModel repository.
 * All DB access for pen brands and models lives here.
 * Business logic belongs in src/services/.
 */

import { eq, and } from "drizzle-orm";
import type { DrizzleDb } from "./db";
import { penBrands, penModels } from "../../drizzle/schema";
import type { NewPenBrand, NewPenModel } from "../../drizzle/schema";

// ── Brands ────────────────────────────────────────────────────────────────────

export async function findAllBrands(db: DrizzleDb) {
  return db.select().from(penBrands).all();
}

export async function findBrandBySlug(db: DrizzleDb, slug: string) {
  return db
    .select()
    .from(penBrands)
    .where(eq(penBrands.slug, slug))
    .get();
}

export async function insertBrand(db: DrizzleDb, data: NewPenBrand) {
  return db.insert(penBrands).values(data).returning().get();
}

// ── Models ────────────────────────────────────────────────────────────────────

export async function findAllModels(
  db: DrizzleDb,
  filters?: { brandId?: string; flowCategory?: string }
) {
  const conditions = [];
  if (filters?.brandId) conditions.push(eq(penModels.brandId, filters.brandId));
  if (filters?.flowCategory)
    conditions.push(eq(penModels.flowCategory, filters.flowCategory as never));

  const query = db
    .select()
    .from(penModels)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return query.all();
}

export async function findModelBySlug(db: DrizzleDb, slug: string) {
  return db
    .select()
    .from(penModels)
    .where(eq(penModels.slug, slug))
    .get();
}

export async function findModelById(db: DrizzleDb, id: string) {
  return db.select().from(penModels).where(eq(penModels.id, id)).get();
}

export async function insertModel(db: DrizzleDb, data: NewPenModel) {
  return db.insert(penModels).values(data).returning().get();
}
