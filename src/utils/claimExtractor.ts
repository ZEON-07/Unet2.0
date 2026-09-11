/**
 * Claim extractor – pure functions that parse web search results for
 * writing-length claims and pen metadata.
 *
 * Deliberately I/O-free so it can be unit-tested without any DB or network.
 */

import type { SearchResult } from "../providers/types";

// ─── Flow category detection ──────────────────────────────────────────────────

export type FlowCategory =
  | "normal_ballpoint"
  | "liquid_rollerball"
  | "smooth_low_viscosity"
  | "gel"
  | "fiber_tip"
  | "felt_tip";

/**
 * Detect the most likely flow category from free text.
 * Falls back to "normal_ballpoint" when nothing matches.
 */
export function detectFlowCategory(text: string): FlowCategory {
  const t = text.toLowerCase();
  if (/(liquid\s)?rollerball|roller\s*ball/.test(t)) return "liquid_rollerball";
  if (/\bgel\b/.test(t)) return "gel";
  if (/smooth|low.?viscosity|ultra.?smooth|hybrid/.test(t))
    return "smooth_low_viscosity";
  if (/fibre|fiber|fineliner|fine.?liner/.test(t)) return "fiber_tip";
  if (/felt.?tip|felt\s+tip/.test(t)) return "felt_tip";
  return "normal_ballpoint";
}

// ─── Writing-length extractor ─────────────────────────────────────────────────

/**
 * Try to extract a writing-length figure in metres from a text snippet.
 *
 * Priority order:
 *  1. Explicit km  (e.g. "3 km", "3 kilometers", "3,000m")
 *  2. Explicit m   (e.g. "1500 m", "1500 metres") — sanity-checked to 100–100 000 m
 *  3. Nothing found → null
 */
export function extractWritingLengthMetres(text: string): number | null {
  const t = text.replace(/,/g, ""); // normalise thousand-separator commas

  // 1. Kilometres
  const kmMatch = t.match(
    /(\d+(?:\.\d+)?)\s*(?:km|kms?|kilo(?:m(?:e(?:t(?:er|re)s?)?)?)?)\b/i
  );
  if (kmMatch) {
    const val = parseFloat(kmMatch[1]);
    if (val > 0 && val <= 100) return Math.round(val * 1000);
  }

  // 2. Metres / meters – must be ≥ 100 m and ≤ 100 000 m to be plausible
  const mMatch = t.match(/(\d+(?:\.\d+)?)\s*(?:m|metres?|meters?)\b(?!\w)/i);
  if (mMatch) {
    const val = parseFloat(mMatch[1]);
    if (val >= 100 && val <= 100_000) return Math.round(val);
  }

  return null;
}

// ─── Source ranking ───────────────────────────────────────────────────────────

/** Domains that are likely to be manufacturer or authoritative sources. */
const PREFERRED_DOMAINS = [
  "bicworld.com",
  "bic.com",
  "flair.in",
  "hauser.com",
  "pilot.com",
  "uni-ball.com",
  "stabilo.com",
  "schneider-schreibgeraete.de",
  "staedtler.com",
];

function isPreferredDomain(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return PREFERRED_DOMAINS.some((d) => hostname.endsWith(d));
  } catch {
    return false;
  }
}

// ─── Extracted claim ─────────────────────────────────────────────────────────

export type ExtractedClaim = {
  /** Writing length in metres extracted from the source */
  writingLengthMetres: number;
  /** Source URL */
  url: string;
  /** Source page title */
  title: string;
  /** Text snippet used for extraction */
  snippet: string;
  /** Detected flow category from snippet */
  flowCategory: FlowCategory;
  /** Whether the source is a known authoritative domain */
  isPreferred: boolean;
  /** Provider relevance score (0–1) */
  score: number;
};

/**
 * Parse a list of search results and return all found writing-length claims.
 *
 * Does NOT invent numbers – only returns entries where a numeric length was
 * successfully parsed. Deduplicates by (url, writingLengthMetres).
 *
 * Results are sorted: preferred domains first, then by score desc.
 */
export function extractClaims(results: SearchResult[]): ExtractedClaim[] {
  const seen = new Set<string>();
  const claims: ExtractedClaim[] = [];

  for (const result of results) {
    // Combine title + content for maximum signal
    const combined = `${result.title} ${result.content}`;
    const metres = extractWritingLengthMetres(combined);
    if (metres === null) continue;

    const dedupeKey = `${result.url}::${metres}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    claims.push({
      writingLengthMetres: metres,
      url: result.url,
      title: result.title,
      snippet: result.content.slice(0, 500),
      flowCategory: detectFlowCategory(combined),
      isPreferred: isPreferredDomain(result.url),
      score: result.score ?? 0,
    });
  }

  // Sort: preferred domains first, then by score desc
  return claims.sort((a, b) => {
    if (a.isPreferred !== b.isPreferred) return a.isPreferred ? -1 : 1;
    return b.score - a.score;
  });
}
