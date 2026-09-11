/**
 * User repository – DB queries for the users table.
 */

import { eq } from "drizzle-orm";
import type { DrizzleDb } from "./db";
import { users } from "../../drizzle/schema";

/** Find a user by email (case-insensitive via SQLite LIKE or lowered comparison). */
export async function findUserByEmail(db: DrizzleDb, email: string) {
  return db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .get();
}

/** Find a user by their UUID. */
export async function findUserById(db: DrizzleDb, id: string) {
  return db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      emailVerified: users.emailVerified,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, id))
    .get();
}
