/**
 * PenModel service.
 * Thin orchestration layer between routes and the repository.
 * Business rules (slug generation, duplicate checks, etc.) live here.
 */

import type { PrismaClient } from "@prisma/client";
import * as penModelRepo from "../repositories/penModel.repository";
import { ConflictError, NotFoundError } from "../utils/errors";

// ─── Brands ───────────────────────────────────────────────────────────────────

export async function getAllBrands(db?: PrismaClient) {
  return penModelRepo.findAllBrands(db);
}

export async function getBrandBySlug(db: PrismaClient | string, slug?: string) {
  const actualSlug = typeof db === "string" ? db : slug!;
  const brand = await penModelRepo.findBrandBySlug(db, actualSlug);
  if (!brand) throw new NotFoundError("PenBrand", actualSlug);
  return brand;
}

export async function createBrand(db: any, data?: any) {
  const actualData = typeof db === "object" && data === undefined ? db : data;
  const existing = await penModelRepo.findBrandBySlug(db, actualData.slug);
  if (existing) throw new ConflictError(`Brand with slug '${actualData.slug}' already exists`);
  return penModelRepo.insertBrand(db, actualData);
}

// ─── Models ───────────────────────────────────────────────────────────────────

export async function getAllModels(
  db?: any,
  filters?: { brandId?: string; flowCategory?: string }
) {
  return penModelRepo.findAllModels(db, filters);
}

export async function getModelBySlug(db: any, slug?: string) {
  const actualSlug = typeof db === "string" ? db : slug!;
  const model = await penModelRepo.findModelBySlug(db, actualSlug);
  if (!model) throw new NotFoundError("PenModel", actualSlug);
  return model;
}

export async function getModelById(db: any, id?: string) {
  const actualId = typeof db === "string" ? db : id!;
  const model = await penModelRepo.findModelById(db, actualId);
  if (!model) throw new NotFoundError("PenModel", actualId);
  return model;
}

export async function createModel(db: any, data?: any) {
  const actualData = typeof db === "object" && data === undefined ? db : data;
  const existing = await penModelRepo.findModelBySlug(db, actualData.slug);
  if (existing) throw new ConflictError(`Model with slug '${actualData.slug}' already exists`);
  return penModelRepo.insertModel(db, actualData);
}
