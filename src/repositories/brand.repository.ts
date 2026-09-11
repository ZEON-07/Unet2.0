/**
 * Brand repository – all D1 queries for pen brands.
 */

import { asc, eq, or, like } from "drizzle-orm";
import type { DrizzleDb } from "./db";
import { penBrands } from "../../drizzle/schema";

/** Return all brands ordered A→Z by name. */
export async function findAllBrands(db: DrizzleDb) {
  return db
    .select({
      id: penBrands.id,
      name: penBrands.name,
      slug: penBrands.slug,
      logoUrl: penBrands.logoUrl,
      countryOfOrigin: penBrands.countryOfOrigin,
    })
    .from(penBrands)
    .orderBy(asc(penBrands.name))
    .all();
}

/** Find a brand by its UUID or slug. */
export async function findBrandById(db: DrizzleDb, id: string) {
  return db
    .select()
    .from(penBrands)
    .where(eq(penBrands.id, id))
    .get();
}

export async function findBrandBySlug(db: DrizzleDb, slug: string) {
  return db
    .select()
    .from(penBrands)
    .where(eq(penBrands.slug, slug))
    .get();
}

/** Find a brand by id OR slug (handy for ":brandId" path param that may be either). */
export async function findBrandByIdOrSlug(db: DrizzleDb, idOrSlug: string) {
  return db
    .select()
    .from(penBrands)
    .where(
      or(eq(penBrands.id, idOrSlug), eq(penBrands.slug, idOrSlug))
    )
    .get();
}

/** Find a brand by name (case-insensitive partial match). */
export async function findBrandByNameLike(db: DrizzleDb, name: string) {
  return db
    .select()
    .from(penBrands)
    .where(like(penBrands.name, `%${name}%`))
    .get();
}
