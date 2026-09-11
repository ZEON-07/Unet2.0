/**
 * Brand service – business logic for brand endpoints.
 */

import type { DrizzleDb } from "../repositories/db";
import * as brandRepo from "../repositories/brand.repository";
import { NotFoundError } from "../utils/errors";

export async function getAllBrands(db: DrizzleDb) {
  return brandRepo.findAllBrands(db);
}

/** Resolve brand by UUID or slug; throws 404 if missing. */
export async function requireBrand(db: DrizzleDb, idOrSlug: string) {
  const brand = await brandRepo.findBrandByIdOrSlug(db, idOrSlug);
  if (!brand) throw new NotFoundError("PenBrand", idOrSlug);
  return brand;
}
