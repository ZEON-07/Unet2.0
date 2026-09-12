/**
 * Shared Prisma client and SQLite database configuration for InkLife.
 *
 * Local database: DATABASE_URL="file:./dev.db"
 * Coolify production: DATABASE_URL="file:/app/data/inklife.db"
 *
 * Required backend replicas: 1 (SQLite local file)
 */

import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

/**
 * Configure SQLite runtime PRAGMAs safely on startup.
 * WAL journal mode enables concurrent readers alongside a writer.
 * busy_timeout gives pending operations up to 5000ms to obtain a lock.
 * foreign_keys ensures relational integrity in SQLite.
 */
export async function configureSQLite(
  client: PrismaClient = prisma
): Promise<void> {
  try {
    await client.$queryRawUnsafe("PRAGMA journal_mode = WAL");
    await client.$queryRawUnsafe("PRAGMA foreign_keys = ON");
    await client.$queryRawUnsafe("PRAGMA busy_timeout = 5000");

    console.log("SQLite WAL mode enabled, foreign keys ON");
  } catch (error) {
    console.error("Failed to configure SQLite:", error);
    throw error;
  }
}

export const configureSqlitePragmas = configureSQLite;

/**
 * Serialize any object/value to JSON string.
 */
export function serializeJson(value: unknown): string {
  return JSON.stringify(value ?? null);
}

/**
 * Parse JSON string safely with a fallback value.
 */
export function parseJson<T>(
  value: string | null | undefined,
  fallback: T
): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
