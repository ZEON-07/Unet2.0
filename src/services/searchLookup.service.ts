/**
 * Search Lookup Service – Phase 4 pipeline orchestration.
 *
 * Flow:
 *  1. Normalise the query (brand+model or free-text)
 *  2. Check cache (Redis or MemoryCacheService, 30-day TTL) → return cached result if present
 *  3. Call search provider
 *  4. Persist SearchLookup record (always, even on provider failure)
 *  5. Extract writing-length claims from results
 *  6. For each claim: find/create PenSource + PenClaim (isVerified = false)
 *  7. Update SearchLookup with final counts / status
 *  8. Cache the result
 *  9. Return response DTO
 */

import { prisma } from "../lib/prisma";
import type { PrismaClient } from "@prisma/client";
import * as searchLookupRepo from "../repositories/searchLookup.repository";
import * as brandRepo from "../repositories/brand.repository";
import * as penRepo from "../repositories/pen.repository";
import { extractClaims } from "../utils/claimExtractor";
import { createProvider } from "../providers/index";
import type { SearchLookupBody } from "../validators/searchLookup.validators";
import { getCacheService, type CacheService } from "./cache.service";

/** The system bot user ID seeded in migration */
const PIPELINE_BOT_USER_ID = "00000000-0000-0000-0000-000000000001";

// ─── Query normalisation ──────────────────────────────────────────────────────

/**
 * Build the canonical search query from the request body.
 * Uses the pattern: "{brand} {model} writing length ink flow manufacturer"
 */
export function buildQuery(body: SearchLookupBody): string {
  if (body.query) return body.query.trim();
  const parts = [body.brand, body.model].filter(Boolean).join(" ");
  return `${parts} writing length ink flow manufacturer`.trim();
}

/** Lowercase + collapse whitespace for a stable cache key. */
export function normalizeQuery(query: string): string {
  return query.toLowerCase().replace(/\s+/g, " ").trim();
}

// ─── Response DTO ─────────────────────────────────────────────────────────────

export type SearchLookupResultDto = {
  lookupId: string;
  status: "completed" | "failed" | "cached";
  message: string;
  pendingClaimsCreated: number;
  cachedResult: boolean;
  providerUsed: string | null;
};

// ─── Pipeline ─────────────────────────────────────────────────────────────────

export async function runSearchLookup(
  db: unknown,
  cacheOrKv: CacheService | any,
  tavilyApiKey: string,
  clientIpHash: string | null,
  body: SearchLookupBody
): Promise<SearchLookupResultDto> {
  const client = (db && typeof db === "object" && "searchLookup" in db ? db : prisma) as PrismaClient;
  const cache: CacheService =
    cacheOrKv && typeof cacheOrKv.get === "function" ? cacheOrKv : getCacheService();

  const rawQuery = buildQuery(body);
  const normalizedQuery = normalizeQuery(rawQuery);
  const cacheKey = searchLookupRepo.buildCacheKey(normalizedQuery);

  // ── 1. Check cache (best-effort) ───────────────────────────────────────────
  try {
    const cached = await cache.get<SearchLookupResultDto>(cacheKey);
    if (cached) {
      // Record a cache-hit lookup row for auditing but return immediately
      const lookupId = crypto.randomUUID();
      await searchLookupRepo.insertSearchLookup(client, {
        id: lookupId,
        query: normalizedQuery,
        brand: body.brand ?? null,
        model: body.model ?? null,
        clientIpHash,
        resultCount: 0,
        status: "cached",
        pendingClaimsCreated: 0,
        cacheHit: true,
        message: cached.message,
        rawResult: null,
        penModelId: null,
      });
      return { ...cached, lookupId, cachedResult: true };
    }
  } catch (err) {
    console.warn("[SearchLookup] Cache check failed, continuing without cache:", err);
  }

  // ── 2. Create the lookup record (before calling provider, so we always persist) ──
  const lookupId = crypto.randomUUID();
  await searchLookupRepo.insertSearchLookup(client, {
    id: lookupId,
    query: normalizedQuery,
    brand: body.brand ?? null,
    model: body.model ?? null,
    clientIpHash,
    resultCount: 0,
    status: "pending",
    pendingClaimsCreated: 0,
    cacheHit: false,
    message: null,
    rawResult: null,
    penModelId: null,
  });

  // ── 3. Call search provider ────────────────────────────────────────────────
  const provider = createProvider(tavilyApiKey);
  let providerResponse;
  try {
    providerResponse = await provider.search(rawQuery);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[SearchLookup] Provider "${provider.name}" failed: ${errorMsg}`);

    const message = "Search provider unavailable. Please try again later.";
    await searchLookupRepo.updateSearchLookup(client, lookupId, {
      status: "failed",
      message,
      rawResult: JSON.stringify({ error: errorMsg }),
    });

    return {
      lookupId,
      status: "failed",
      message,
      pendingClaimsCreated: 0,
      cachedResult: false,
      providerUsed: provider.name,
    };
  }

  // ── 4. Extract claims from results ────────────────────────────────────────
  const extractedClaims = extractClaims(providerResponse.results);

  // ── 5. Try to match a pen model from brand+model inputs ───────────────────
  let resolvedPenModelId: string | null = null;
  if (body.brand && body.model) {
    const brandRow = await brandRepo.findBrandByNameLike(client, body.brand);
    if (brandRow) {
      const penRow = await penRepo.findPenByBrandAndName(client, brandRow.id, body.model);
      if (penRow) resolvedPenModelId = penRow.id;
    }
  }

  // ── 6. Persist pending PenSource + PenClaim for each extracted claim ──────
  let pendingClaimsCreated = 0;

  for (const claim of extractedClaims) {
    if (!resolvedPenModelId) continue;

    try {
      // 6a. Find or create PenSource by URL
      let sourceId: string | null = null;
      const existingSource = await client.penSource.findFirst({
        where: { url: claim.url },
      });

      if (existingSource) {
        sourceId = existingSource.id;
      } else {
        const hostname = (() => {
          try {
            return new URL(claim.url).hostname;
          } catch {
            return claim.url.slice(0, 100);
          }
        })();
        const newSource = await client.penSource.create({
          data: {
            sourceType: "online",
            name: claim.title.slice(0, 100) || hostname,
            url: claim.url,
            isVerified: false,
          },
        });
        sourceId = newSource.id;
      }

      // 6b. Create pending PenClaim (isVerified = false — never auto-activate)
      await client.penClaim.create({
        data: {
          userId: PIPELINE_BOT_USER_ID,
          penModelId: resolvedPenModelId,
          sourceId,
          mileageClaimed: claim.writingLengthMetres,
          notes: `Auto-extracted by search pipeline from: ${claim.url}\nSnippet: ${claim.snippet.slice(0, 300)}`,
          isVerified: false,
        },
      });

      pendingClaimsCreated++;
    } catch (err) {
      console.error(`[SearchLookup] Failed to persist claim: ${err}`);
    }
  }

  // ── 7. Build summary message ──────────────────────────────────────────────
  const message = (() => {
    if (pendingClaimsCreated > 0) {
      return `Found ${pendingClaimsCreated} potential claim${pendingClaimsCreated !== 1 ? "s" : ""}. They are pending admin review.`;
    }
    if (extractedClaims.length > 0 && !resolvedPenModelId) {
      return "Found search results with writing-length data, but the pen model is not in the database yet. Add the pen first, then re-run this lookup.";
    }
    return "No writing-length claims could be extracted from the search results.";
  })();

  // ── 8. Update the lookup record with final state ──────────────────────────
  await searchLookupRepo.updateSearchLookup(client, lookupId, {
    status: "completed",
    resultCount: providerResponse.results.length,
    rawResult: JSON.stringify(providerResponse.rawResponse),
    pendingClaimsCreated,
    penModelId: resolvedPenModelId,
    message,
  });

  // ── 9. Cache result (30 days, best-effort) ────────────────────────────────
  const cachePayload: Omit<SearchLookupResultDto, "lookupId"> = {
    status: "completed",
    message,
    pendingClaimsCreated,
    cachedResult: false,
    providerUsed: provider.name,
  };

  try {
    await cache.set(cacheKey, cachePayload, searchLookupRepo.SEARCH_CACHE_TTL_SECONDS);
  } catch (err) {
    console.warn("[SearchLookup] Cache SET failed, continuing:", err);
  }

  return {
    lookupId,
    ...cachePayload,
    cachedResult: false,
  };
}
