/**
 * Brand repository – Prisma queries for pen brands.
 */

import { prisma } from "../lib/prisma";
import type { PrismaClient } from "@prisma/client";

function getClient(db?: unknown): PrismaClient {
  return (db && typeof db === "object" && "penBrand" in db ? db : prisma) as PrismaClient;
}

/** Return all brands ordered A→Z by name. */
export async function findAllBrands(db?: unknown) {
  const client = getClient(db);
  return client.penBrand.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      countryOfOrigin: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}

/** Find a brand by its UUID. */
export async function findBrandById(db: unknown, id?: string) {
  const actualId = typeof db === "string" ? db : id!;
  const client = getClient(db);
  return client.penBrand.findUnique({
    where: { id: actualId },
  });
}

export async function findBrandBySlug(db: unknown, slug?: string) {
  const actualSlug = typeof db === "string" ? db : slug!;
  const client = getClient(db);
  return client.penBrand.findUnique({
    where: { slug: actualSlug },
  });
}

/** Find a brand by id OR slug. */
export async function findBrandByIdOrSlug(db: unknown, idOrSlug?: string) {
  const actual = typeof db === "string" ? db : idOrSlug!;
  const client = getClient(db);
  return client.penBrand.findFirst({
    where: {
      OR: [{ id: actual }, { slug: actual }],
    },
  });
}

/** Find a brand by name (case-insensitive partial match). */
export async function findBrandByNameLike(db: unknown, name?: string) {
  const actualName = typeof db === "string" ? db : name!;
  const client = getClient(db);
  return client.penBrand.findFirst({
    where: {
      name: {
        contains: actualName,
      },
    },
  });
}
