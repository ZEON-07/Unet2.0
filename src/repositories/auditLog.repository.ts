/**
 * Admin audit log repository.
 */

import type { DrizzleDb } from "./db";
import { adminAuditLogs } from "../../drizzle/schema";
import type { NewAdminAuditLog } from "../../drizzle/schema";

/**
 * Insert a record into admin_audit_logs.
 * Must be called after every admin mutation.
 */
export async function insertAuditLog(
  db: DrizzleDb,
  data: Omit<NewAdminAuditLog, "id" | "createdAt">
) {
  const id = crypto.randomUUID();
  return db.insert(adminAuditLogs).values({ ...data, id }).returning().get();
}
