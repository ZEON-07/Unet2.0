/**
 * Admin audit log repository – Prisma version.
 */

import { prisma } from "../lib/prisma";
import type { PrismaClient } from "@prisma/client";

function getClient(db?: unknown): PrismaClient {
  return (db && typeof db === "object" && "adminAuditLog" in db ? db : prisma) as PrismaClient;
}

/**
 * Insert a record into admin_audit_logs.
 * Must be called after every admin mutation.
 */
export async function insertAuditLog(
  db: unknown,
  data?: any
) {
  const payload = typeof db === "object" && data === undefined ? db : data;
  const client = getClient(db);
  return client.adminAuditLog.create({
    data: payload,
  });
}
