/**
 * PenModel repository.
 * All DB access for pen brands and models lives here.
 */

import { prisma } from "../lib/prisma";
import type { PrismaClient } from "@prisma/client";

function getClient(db?: unknown): PrismaClient {
  return (db && typeof db === "object" && "penModel" in db ? db : prisma) as PrismaClient;
}

// ── Brands ────────────────────────────────────────────────────────────────────

export async function findAllBrands(db?: unknown) {
  const client = getClient(db);
  return client.penBrand.findMany({
    orderBy: { name: "asc" },
  });
}

export async function findBrandBySlug(db: unknown, slug?: string) {
  const actualSlug = typeof db === "string" ? db : slug!;
  const client = getClient(db);
  return client.penBrand.findUnique({
    where: { slug: actualSlug },
  });
}

export async function insertBrand(db: unknown, data?: any) {
  const payload = typeof db === "object" && data === undefined ? db : data;
  const client = getClient(db);
  return client.penBrand.create({
    data: payload,
  });
}

// ── Models ────────────────────────────────────────────────────────────────────

export async function findAllModels(
  db?: unknown,
  filters?: { brandId?: string; flowCategory?: string }
) {
  const actualFilters =
    db && typeof db === "object" && !("penModel" in db) ? (db as any) : filters;
  const client = getClient(db);

  const where: any = {};
  if (actualFilters?.brandId) where.brandId = actualFilters.brandId;
  if (actualFilters?.flowCategory) where.flowCategory = actualFilters.flowCategory;

  return client.penModel.findMany({
    where,
    orderBy: { name: "asc" },
  });
}

export async function findModelBySlug(db: unknown, slug?: string) {
  const actualSlug = typeof db === "string" ? db : slug!;
  const client = getClient(db);
  return client.penModel.findUnique({
    where: { slug: actualSlug },
  });
}

export async function findModelById(db: unknown, id?: string) {
  const actualId = typeof db === "string" ? db : id!;
  const client = getClient(db);
  return client.penModel.findUnique({
    where: { id: actualId },
  });
}

export async function insertModel(db: unknown, data?: any) {
  const payload = typeof db === "object" && data === undefined ? db : data;
  const client = getClient(db);
  return client.penModel.create({
    data: payload,
  });
}
