import { prisma } from "../lib/prisma";
import type { PrismaClient } from "@prisma/client";

export type DrizzleDb = PrismaClient;
export type DbClient = PrismaClient;

/**
 * Return the shared Prisma client instance.
 * Preserves backward compatibility with legacy createDb(c.env.DB) call signatures.
 */
export function createDb(_d1?: unknown): PrismaClient {
  return prisma;
}

export { prisma };
