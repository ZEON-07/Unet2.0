/**
 * Search lookup routes
 *
 * POST /api/search-lookups  → trigger a web-search lookup pipeline
 */

import { Hono } from "hono";
import type { HonoEnv } from "../types/bindings";
import { createDb } from "../repositories/db";
import { zValidator } from "../utils/zValidator";
import { searchLookupBodySchema } from "../validators/searchLookup.validators";
import { runSearchLookup } from "../services/searchLookup.service";

const searchLookupsRoute = new Hono<HonoEnv>();

// ─── POST /api/search-lookups ────────────────────────────────────────────────

searchLookupsRoute.post(
  "/",
  zValidator("json", searchLookupBodySchema),
  async (c) => {
    const body = c.req.valid("json");
    const db = createDb(c.env.DB);

    // Build a privacy-safe one-way hash of the client IP for the audit trail
    const rawIp =
      c.req.header("CF-Connecting-IP") ??
      c.req.header("X-Forwarded-For")?.split(",")[0]?.trim() ??
      null;

    const clientIpHash = rawIp
      ? await hashIp(rawIp)
      : null;

    const result = await runSearchLookup(
      db,
      c.env.SEARCH_CACHE_KV,
      c.env.TAVILY_API_KEY ?? "",
      clientIpHash,
      body
    );

    return c.json(
      {
        success: true,
        data: result,
        requestId: c.get("requestId"),
      },
      result.status === "failed" ? 500 : 200
    );
  }
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Hash an IP address with SHA-256 for privacy-safe audit logging.
 * Uses Web Crypto, which is available in CF Workers.
 */
async function hashIp(ip: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(ip)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16); // Keep first 16 hex chars (64 bits) – sufficient for dedup
}

export { searchLookupsRoute };
