import { drizzle } from "drizzle-orm/d1";
import * as schema from "../../drizzle/schema";

export type DrizzleDb = ReturnType<typeof createDb>;

/**
 * Create a Drizzle ORM instance bound to the D1 database.
 * Call once per request with the request's DB binding.
 */
export function createDb(d1: D1Database) {
  return drizzle(d1, { schema });
}
