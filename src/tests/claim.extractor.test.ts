/**
 * Unit tests for Phase 4: Claim Extractor & Search Lookup Query Builders
 *
 * Run with:  npx tsx src/tests/claim.extractor.test.ts
 */

import {
  detectFlowCategory,
  extractWritingLengthMetres,
  extractClaims,
} from "../utils/claimExtractor";
import { buildQuery, normalizeQuery } from "../services/searchLookup.service";
import type { SearchResult } from "../providers/types";

// ─── Assertion helpers ────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(condition: boolean, message: string): void {
  if (!condition) {
    const msg = `❌ FAIL: ${message}`;
    console.error(`  ${msg}`);
    failures.push(msg);
    failed++;
  } else {
    console.log(`  ✅ ${message}`);
    passed++;
  }
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  assert(
    actual === expected,
    `${message} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

console.log("\n============================================================");
console.log("Phase 4: Claim Extractor & Pipeline Tests");
console.log("============================================================\n");

// 1. detectFlowCategory
console.log("📋 detectFlowCategory");
assertEqual(detectFlowCategory("This is a rollerball pen"), "liquid_rollerball", "rollerball detected");
assertEqual(detectFlowCategory("Smooth liquid roller ball tip"), "liquid_rollerball", "liquid roller ball detected");
assertEqual(detectFlowCategory("Quick drying gel pen 0.5mm"), "gel", "gel detected");
assertEqual(detectFlowCategory("Low-viscosity hybrid ink formula"), "smooth_low_viscosity", "low-viscosity hybrid detected");
assertEqual(detectFlowCategory("Ultra smooth ballpoint"), "smooth_low_viscosity", "ultra smooth detected");
assertEqual(detectFlowCategory("Precision fineliner for sketching"), "fiber_tip", "fineliner detected as fiber_tip");
assertEqual(detectFlowCategory("Felt-tip marker pen"), "felt_tip", "felt-tip detected");
assertEqual(detectFlowCategory("Standard office writing instrument"), "normal_ballpoint", "fallback to normal_ballpoint");

// 2. extractWritingLengthMetres
console.log("\n📋 extractWritingLengthMetres");
assertEqual(extractWritingLengthMetres("Writing distance of 3 km"), 3000, "3 km → 3000m");
assertEqual(extractWritingLengthMetres("Long lasting up to 3.5 kilometers"), 3500, "3.5 kilometers → 3500m");
assertEqual(extractWritingLengthMetres("Guaranteed 10,000 meters writing length"), 10000, "10,000 meters with comma → 10000m");
assertEqual(extractWritingLengthMetres("Refill lasts for 1500m of smooth ink"), 1500, "1500m → 1500m");
assertEqual(extractWritingLengthMetres("500 metres guaranteed by manufacturer"), 500, "500 metres → 500m");
assertEqual(extractWritingLengthMetres("Super durable 2500 m line"), 2500, "2500 m → 2500m");
assertEqual(extractWritingLengthMetres("Small 10 m line"), null, "10 m is under 100m threshold → null");
assertEqual(extractWritingLengthMetres("Astronomical 200,000 metres"), null, "200,000 m is above 100,000m threshold → null");
assertEqual(extractWritingLengthMetres("0.5mm tip size and blue ink"), null, "tip size without length → null");
assertEqual(extractWritingLengthMetres("No length mentioned anywhere"), null, "empty text → null");

// 3. extractClaims
console.log("\n📋 extractClaims");
const sampleResults: SearchResult[] = [
  {
    title: "Flair Writo-meter 10,000m Ball Pen",
    url: "https://flair.in/pens/writometer",
    content: "Flair Writo-meter is the world longest writing pen. Writes 10 km continuously with liquid rollerball feel.",
    score: 0.95,
  },
  {
    title: "Bic Cristal Review - Classic Ballpoint",
    url: "https://bicworld.com/products/cristal",
    content: "The iconic Bic Cristal provides up to 3 km of clean writing.",
    score: 0.9,
  },
  {
    title: "Blog Post About Pens",
    url: "https://randomblog.com/my-pens",
    content: "This pen has 2000 m of ink and writes well.",
    score: 0.99,
  },
  {
    title: "Duplicate Link Review",
    url: "https://randomblog.com/my-pens",
    content: "Another mention of 2000m writing length.",
    score: 0.8,
  },
  {
    title: "No numbers here",
    url: "https://example.com/pen",
    content: "Just a blue gel pen with 0.7mm tip.",
    score: 0.5,
  },
];

const claims = extractClaims(sampleResults);
assertEqual(claims.length, 3, "Extracts exactly 3 claims (ignores non-matches and duplicate url+length)");
assertEqual(claims[0].writingLengthMetres, 10000, "First claim is Flair (preferred domain + km parsed)");
assertEqual(claims[0].isPreferred, true, "flair.in is marked preferred");
assertEqual(claims[1].writingLengthMetres, 3000, "Second claim is Bic (preferred domain)");
assertEqual(claims[1].isPreferred, true, "bicworld.com is marked preferred");
assertEqual(claims[2].writingLengthMetres, 2000, "Third claim is non-preferred blog");
assertEqual(claims[2].isPreferred, false, "randomblog.com is not preferred");

// 4. Query building & normalisation
console.log("\n📋 Query building and normalisation");
assertEqual(
  buildQuery({ brand: "Hauser", model: "XO" }),
  "Hauser XO writing length ink flow manufacturer",
  "buildQuery constructs canonical pattern"
);
assertEqual(
  buildQuery({ query: "Custom Search Query Here" }),
  "Custom Search Query Here",
  "buildQuery preserves explicit query"
);
assertEqual(
  normalizeQuery("  Hauser    XO   Writing Length  "),
  "hauser xo writing length",
  "normalizeQuery lowercases and collapses multiple spaces"
);

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log("\n────────────────────────────────────────────────────────────");
console.log(`Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  console.error(`\n❌ ${failed} test(s) failed:`);
  failures.forEach((f) => console.error(f));
  throw new Error(`${failed} test(s) failed`);
} else {
  console.log(`\n✅ All ${passed} tests passed\n`);
}
