/**
 * User repository – Prisma queries for the users table.
 */

import { prisma } from "../lib/prisma";
import type { PrismaClient } from "@prisma/client";

function getClient(db?: unknown): PrismaClient {
  return (db && typeof db === "object" && "user" in db ? db : prisma) as PrismaClient;
}

/** Find a user by email (case-insensitive). */
export async function findUserByEmail(db: unknown, email?: string) {
  const actualEmail = typeof db === "string" ? db : email!;
  const client = getClient(db);
  return client.user.findFirst({
    where: {
      email: actualEmail.toLowerCase(),
    },
  });
}

/** Find a user by their UUID. */
export async function findUserById(db: unknown, id?: string) {
  const actualId = typeof db === "string" ? db : id!;
  const client = getClient(db);
  return client.user.findUnique({
    where: { id: actualId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      emailVerified: true,
      createdAt: true,
    },
  });
}
