/**
 * PenModel service.
 * Thin orchestration layer between routes and the repository.
 * Business rules (slug generation, duplicate checks, etc.) live here.
 */

import type { DrizzleDb } from "../repositories/db";
import * as penModelRepo from "../repositories/penModel.repository";
import type { NewPenBrand, NewPenModel } from "../../drizzle/schema";
import { ConflictError, NotFoundError } from "../utils/errors";

// ─── Brands ───────────────────────────────────────────────────────────────────

export async function getAllBrands(db: DrizzleDb) {
  return penModelRepo.findAllBrands(db);
}

export async function getBrandBySlug(db: DrizzleDb, slug: string) {
  const brand = await penModelRepo.findBrandBySlug(db, slug);
  if (!brand) throw new NotFoundError("PenBrand", slug);
  return brand;
}

export async function createBrand(db: DrizzleDb, data: NewPenBrand) {
  const existing = await penModelRepo.findBrandBySlug(db, data.slug);
  if (existing) throw new ConflictError(`Brand with slug '${data.slug}' already exists`);
  return penModelRepo.insertBrand(db, data);
}

// ─── Models ───────────────────────────────────────────────────────────────────

export async function getAllModels(
  db: DrizzleDb,
  filters?: { brandId?: string; flowCategory?: string }
) {
  return penModelRepo.findAllModels(db, filters);
}

export async function getModelBySlug(db: DrizzleDb, slug: string) {
  const model = await penModelRepo.findModelBySlug(db, slug);
  if (!model) throw new NotFoundError("PenModel", slug);
  return model;
}

export async function getModelById(db: DrizzleDb, id: string) {
  const model = await penModelRepo.findModelById(db, id);
  if (!model) throw new NotFoundError("PenModel", id);
  return model;
}

export async function createModel(db: DrizzleDb, data: NewPenModel) {
  const existing = await penModelRepo.findModelBySlug(db, data.slug);
  if (existing) throw new ConflictError(`Model with slug '${data.slug}' already exists`);
  return penModelRepo.insertModel(db, data);
}
