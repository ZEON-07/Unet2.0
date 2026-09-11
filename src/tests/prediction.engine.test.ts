/**
 * Unit tests for the InkLife Prediction Engine v2.0.0
 *
 * Run with:  npm test
 *            (or: npx tsx src/tests/prediction.engine.test.ts)
 *
 * No external test runner required — pure Node-compatible assertions.
 * All functions under test are PURE (zero I/O), so no Workers context needed.
 */

import {
  calculatePrediction,
  resolveWritingLength,
  resolveConfidence,
  getFlowFactor,
  getWritingStyleFactor,
  getNotebookFactor,
  calcPages,
  FLOW_FACTORS,
  WRITING_STYLE_FACTORS,
  NOTEBOOK_FACTORS,
  METRES_PER_QUEEN_PAGE,
  CATEGORY_FALLBACK_METRES,
  DEFAULT_FALLBACK_METRES,
  ENGINE_VERSION,
} from "../services/prediction.engine";
import type { WritingStyle, NotebookType } from "../validators/prediction.validators";

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

function assertClose(actual: number, expected: number, message: string, tolerance = 1): void {
  assert(
    Math.abs(actual - expected) <= tolerance,
    `${message} — expected ≈${expected} (±${tolerance}), got ${actual}`
  );
}

function assertGt(a: number, b: number, message: string): void {
  assert(a > b, `${message} — expected ${a} > ${b}`);
}

function describe(name: string, fn: () => void): void {
  console.log(`\n📋 ${name}`);
  fn();
}

// ─── Constants sanity ─────────────────────────────────────────────────────────

describe("ENGINE_VERSION is defined", () => {
  assert(typeof ENGINE_VERSION === "string" && ENGINE_VERSION.length > 0, `ENGINE_VERSION is a non-empty string (${ENGINE_VERSION})`);
  assertEqual(ENGINE_VERSION, "2.0.0", "ENGINE_VERSION is 2.0.0");
});

describe("METRES_PER_QUEEN_PAGE", () => {
  assertEqual(METRES_PER_QUEEN_PAGE, 4, "queen page baseline is 4m");
});

describe("FLOW_FACTORS all positive", () => {
  for (const [cat, factor] of Object.entries(FLOW_FACTORS)) {
    assert(factor > 0, `${cat}: factor ${factor} > 0`);
  }
});

describe("FLOW_FACTORS ordering (lower = more efficient ink use)", () => {
  assert(FLOW_FACTORS.fiber_tip < FLOW_FACTORS.normal_ballpoint, "fiber_tip < normal_ballpoint");
  assert(FLOW_FACTORS.felt_tip < FLOW_FACTORS.normal_ballpoint, "felt_tip < normal_ballpoint");
  assert(FLOW_FACTORS.normal_ballpoint < FLOW_FACTORS.smooth_low_viscosity, "normal_ballpoint < smooth_low_viscosity");
  assert(FLOW_FACTORS.smooth_low_viscosity < FLOW_FACTORS.gel, "smooth_low_viscosity < gel");
  assert(FLOW_FACTORS.gel < FLOW_FACTORS.liquid_rollerball, "gel < liquid_rollerball");
});

describe("FLOW_FACTORS exact values", () => {
  assertEqual(FLOW_FACTORS.normal_ballpoint, 1.0, "normal_ballpoint = 1.0");
  assertEqual(FLOW_FACTORS.smooth_low_viscosity, 1.15, "smooth_low_viscosity = 1.15");
  assertEqual(FLOW_FACTORS.gel, 1.3, "gel = 1.3");
  assertEqual(FLOW_FACTORS.liquid_rollerball, 1.45, "liquid_rollerball = 1.45");
  assertEqual(FLOW_FACTORS.fiber_tip, 0.85, "fiber_tip = 0.85");
  assertEqual(FLOW_FACTORS.felt_tip, 0.85, "felt_tip = 0.85");
});

describe("WRITING_STYLE_FACTORS exact values", () => {
  assertEqual(WRITING_STYLE_FACTORS.light, 0.85, "light = 0.85");
  assertEqual(WRITING_STYLE_FACTORS.normal, 1.0, "normal = 1.0");
  assertEqual(WRITING_STYLE_FACTORS.heavy, 1.25, "heavy = 1.25");
});

describe("NOTEBOOK_FACTORS exact values", () => {
  assertEqual(NOTEBOOK_FACTORS.long_book, 0.85, "long_book = 0.85");
  assertEqual(NOTEBOOK_FACTORS.queen_book, 1.0, "queen_book = 1.0");
  assertEqual(NOTEBOOK_FACTORS.king_book, 1.2, "king_book = 1.2");
});

// ─── getFlowFactor ────────────────────────────────────────────────────────────

describe("getFlowFactor", () => {
  for (const cat of Object.keys(FLOW_FACTORS)) {
    assertEqual(getFlowFactor(cat), FLOW_FACTORS[cat], `getFlowFactor("${cat}") matches FLOW_FACTORS`);
  }
  assertEqual(getFlowFactor("unknown_exotic_pen"), 1.0, "unknown category falls back to 1.0");
  assertEqual(getFlowFactor(""), 1.0, "empty string falls back to 1.0");
});

// ─── getWritingStyleFactor ────────────────────────────────────────────────────

describe("getWritingStyleFactor", () => {
  assertEqual(getWritingStyleFactor("light"), 0.85, "light = 0.85");
  assertEqual(getWritingStyleFactor("normal"), 1.0, "normal = 1.0");
  assertEqual(getWritingStyleFactor("heavy"), 1.25, "heavy = 1.25");
});

// ─── getNotebookFactor ────────────────────────────────────────────────────────

describe("getNotebookFactor", () => {
  assertEqual(getNotebookFactor("long_book"), 0.85, "long_book = 0.85");
  assertEqual(getNotebookFactor("queen_book"), 1.0, "queen_book = 1.0");
  assertEqual(getNotebookFactor("king_book"), 1.2, "king_book = 1.2");
});

// ─── calcPages ────────────────────────────────────────────────────────────────

describe("calcPages: formula = round(usable / (4 × notebookFactor))", () => {
  // queenBook: round(400 / (4 × 1.0)) = 100
  assertEqual(calcPages(400, "queen_book"), 100, "400m → 100 queen pages");
  // longBook: round(400 / (4 × 0.85)) = round(400 / 3.4) = round(117.6) = 118
  assertEqual(calcPages(400, "long_book"), 118, "400m → 118 long pages");
  // kingBook: round(400 / (4 × 1.2)) = round(400 / 4.8) = round(83.3) = 83
  assertEqual(calcPages(400, "king_book"), 83, "400m → 83 king pages");
  // Zero distance → 0 pages
  assertEqual(calcPages(0, "queen_book"), 0, "0m → 0 pages");
});

// ─── SPEC EXAMPLE: Hauser XO ─────────────────────────────────────────────────

describe("SPEC EXAMPLE — Hauser XO (smooth_low_viscosity, 1500m, ink=6, heavy, king_book)", () => {
  const result = calculatePrediction({
    totalWritingLengthMeters: 1500,
    flowCategory: "smooth_low_viscosity",
    inkRating: 6,
    writingStyle: "heavy",
    notebookType: "king_book",
  });

  assertEqual(result.inkFraction, 0.6, "inkFraction = 0.6");
  assertEqual(result.inkPercentage, 60, "inkPercentage = 60");
  assertEqual(result.remainingDistanceMeters, 900, "remainingDistanceMeters = 900");
  // usable = 900 / (1.15 × 1.25) = 900 / 1.4375 ≈ 625.98 → 626
  assertClose(result.usableDistanceMeters, 626, "usableDistanceMeters ≈ 626");
  // longBook  = 626 / (4 × 0.85) = 626 / 3.4 ≈ 184.1 → 184
  assertEqual(result.pageEstimates.longBook, 184, "pageEstimates.longBook = 184");
  // queenBook = 626 / (4 × 1.0)  = 626 / 4 ≈ 156.5 → 157
  assertEqual(result.pageEstimates.queenBook, 157, "pageEstimates.queenBook = 157");
  // kingBook  = 626 / (4 × 1.2)  = 626 / 4.8 ≈ 130.4 → 130
  assertEqual(result.pageEstimates.kingBook, 130, "pageEstimates.kingBook = 130");
  assertEqual(result.estimatedPages, 130, "estimatedPages = 130 (king_book)");
  assertEqual(result.flowFactor, 1.15, "flowFactor = 1.15");
  assertEqual(result.writingStyleFactor, 1.25, "writingStyleFactor = 1.25");
});

// ─── BIC Cristal Original ─────────────────────────────────────────────────────

describe("BIC Cristal Original (normal_ballpoint, 3000m, ink=10, normal, queen_book)", () => {
  const result = calculatePrediction({
    totalWritingLengthMeters: 3000,
    flowCategory: "normal_ballpoint",
    inkRating: 10,
    writingStyle: "normal",
    notebookType: "queen_book",
  });

  assertEqual(result.inkFraction, 1.0, "inkFraction = 1.0 (full pen)");
  assertEqual(result.inkPercentage, 100, "inkPercentage = 100");
  assertEqual(result.remainingDistanceMeters, 3000, "remainingDistanceMeters = 3000");
  // flowFactor=1.0, writingStyle=1.0 → usable = 3000
  assertEqual(result.usableDistanceMeters, 3000, "usableDistanceMeters = 3000 (no divisor effect)");
  assertEqual(result.pageEstimates.queenBook, 750, "queenBook = 750");
  assertEqual(result.estimatedPages, 750, "estimatedPages = 750");
});

// ─── Edge case: inkRating = 0 (empty pen) ────────────────────────────────────

describe("Edge case: inkRating = 0 (empty pen → all zeros)", () => {
  const result = calculatePrediction({
    totalWritingLengthMeters: 3000,
    flowCategory: "normal_ballpoint",
    inkRating: 0,
    writingStyle: "normal",
    notebookType: "queen_book",
  });

  assertEqual(result.inkFraction, 0, "inkFraction = 0");
  assertEqual(result.inkPercentage, 0, "inkPercentage = 0");
  assertEqual(result.remainingDistanceMeters, 0, "remainingDistanceMeters = 0");
  assertEqual(result.usableDistanceMeters, 0, "usableDistanceMeters = 0");
  assertEqual(result.estimatedPages, 0, "estimatedPages = 0");
  assertEqual(result.pageEstimates.longBook, 0, "longBook = 0");
  assertEqual(result.pageEstimates.queenBook, 0, "queenBook = 0");
  assertEqual(result.pageEstimates.kingBook, 0, "kingBook = 0");
});

// ─── Edge case: inkRating = 10 (full pen) ────────────────────────────────────

describe("Edge case: inkRating = 10 (full gel pen, light writing, long_book)", () => {
  const result = calculatePrediction({
    totalWritingLengthMeters: 1000,
    flowCategory: "gel",
    inkRating: 10,
    writingStyle: "light",
    notebookType: "long_book",
  });

  assertEqual(result.inkFraction, 1.0, "inkFraction = 1.0");
  // usable = 1000 / (1.3 × 0.85) = 1000 / 1.105 ≈ 904.98 → 905
  assertClose(result.usableDistanceMeters, 905, "usableDistanceMeters ≈ 905");
  // longBook = 905 / (4 × 0.85) = 905 / 3.4 ≈ 265.9 → 266
  assertClose(result.pageEstimates.longBook, 266, "longBook ≈ 266");
  assertEqual(result.estimatedPages, result.pageEstimates.longBook, "estimatedPages = longBook (correct notebookType routed)");
});

// ─── Edge case: liquid_rollerball, heavy ─────────────────────────────────────

describe("Flair Writo-meter (liquid_rollerball, 10000m, ink=5, heavy, queen_book)", () => {
  const result = calculatePrediction({
    totalWritingLengthMeters: 10000,
    flowCategory: "liquid_rollerball",
    inkRating: 5,
    writingStyle: "heavy",
    notebookType: "queen_book",
  });

  assertEqual(result.remainingDistanceMeters, 5000, "remainingDistanceMeters = 5000");
  // usable = 5000 / (1.45 × 1.25) = 5000 / 1.8125 ≈ 2758.6 → 2759
  assertClose(result.usableDistanceMeters, 2759, "usableDistanceMeters ≈ 2759");
  assertClose(result.pageEstimates.queenBook, 690, "queenBook ≈ 690");
  assertEqual(result.estimatedPages, result.pageEstimates.queenBook, "estimatedPages = queenBook");
});

// ─── All flow categories × inkRating=5, normal/queen ─────────────────────────

describe("All flow categories produce valid results (ink=5, normal, queen_book)", () => {
  const flowCats = Object.keys(FLOW_FACTORS);
  for (const cat of flowCats) {
    const result = calculatePrediction({
      totalWritingLengthMeters: 2000,
      flowCategory: cat,
      inkRating: 5,
      writingStyle: "normal",
      notebookType: "queen_book",
    });
    assert(result.usableDistanceMeters >= 0, `${cat}: usableDistance ≥ 0`);
    assert(result.estimatedPages >= 0, `${cat}: estimatedPages ≥ 0`);
    assert(Number.isFinite(result.usableDistanceMeters), `${cat}: usableDistance is finite`);
  }
});

// ─── Writing style ordering ───────────────────────────────────────────────────

describe("Writing style ordering: light > normal > heavy (same pen, ink=5, queen_book)", () => {
  const base = {
    totalWritingLengthMeters: 2000,
    flowCategory: "normal_ballpoint",
    inkRating: 5,
    notebookType: "queen_book" as NotebookType,
  };

  const light = calculatePrediction({ ...base, writingStyle: "light" });
  const normal = calculatePrediction({ ...base, writingStyle: "normal" });
  const heavy = calculatePrediction({ ...base, writingStyle: "heavy" });

  assertGt(light.usableDistanceMeters, normal.usableDistanceMeters, "light → more usable than normal");
  assertGt(normal.usableDistanceMeters, heavy.usableDistanceMeters, "normal → more usable than heavy");
  assertGt(light.estimatedPages, normal.estimatedPages, "light → more pages than normal");
  assertGt(normal.estimatedPages, heavy.estimatedPages, "normal → more pages than heavy");
});

// ─── Notebook ordering ────────────────────────────────────────────────────────

describe("Notebook page ordering: long_book > queen_book > king_book (same input)", () => {
  const result = calculatePrediction({
    totalWritingLengthMeters: 3000,
    flowCategory: "normal_ballpoint",
    inkRating: 10,
    writingStyle: "normal",
    notebookType: "queen_book",
  });

  assertGt(result.pageEstimates.longBook, result.pageEstimates.queenBook, "longBook > queenBook");
  assertGt(result.pageEstimates.queenBook, result.pageEstimates.kingBook, "queenBook > kingBook");
});

// ─── estimatedPages routes correctly ─────────────────────────────────────────

describe("estimatedPages always matches the requested notebookType", () => {
  const base = {
    totalWritingLengthMeters: 2000,
    flowCategory: "normal_ballpoint",
    inkRating: 8,
    writingStyle: "normal" as WritingStyle,
  };

  const r1 = calculatePrediction({ ...base, notebookType: "long_book" });
  assertEqual(r1.estimatedPages, r1.pageEstimates.longBook, "long_book → longBook");

  const r2 = calculatePrediction({ ...base, notebookType: "queen_book" });
  assertEqual(r2.estimatedPages, r2.pageEstimates.queenBook, "queen_book → queenBook");

  const r3 = calculatePrediction({ ...base, notebookType: "king_book" });
  assertEqual(r3.estimatedPages, r3.pageEstimates.kingBook, "king_book → kingBook");
});

// ─── inkFraction / inkPercentage identity ────────────────────────────────────

describe("inkFraction and inkPercentage are consistent for all integer ratings 0–10", () => {
  for (let rating = 0; rating <= 10; rating++) {
    const result = calculatePrediction({
      totalWritingLengthMeters: 1000,
      flowCategory: "normal_ballpoint",
      inkRating: rating,
      writingStyle: "normal",
      notebookType: "queen_book",
    });
    assertClose(result.inkFraction, rating / 10, `inkFraction for rating ${rating}`, 0.0001);
    assertEqual(result.inkPercentage, rating * 10, `inkPercentage for rating ${rating}`);
  }
});

// ─── manufacturer claim never multiplied by native flow ──────────────────────

describe("Critical rule: manufacturer claim is NOT multiplied by flow factor (accuracy rule #2)", () => {
  // For normal_ballpoint (factor=1.0): remaining = total × inkFraction
  // usable = remaining / (1.0 × 1.0) = remaining — i.e. no change when all factors = 1
  const result = calculatePrediction({
    totalWritingLengthMeters: 1000,
    flowCategory: "normal_ballpoint",
    inkRating: 10,
    writingStyle: "normal",
    notebookType: "queen_book",
  });
  assertEqual(result.remainingDistanceMeters, 1000, "remaining = total when ink=10");
  assertEqual(result.usableDistanceMeters, 1000, "usable = remaining when flowFactor=1 and writingStyle=normal");
  // If the claim were re-multiplied by native flow (1.0), result would be 1000 — same here.
  // Now verify a case where re-multiplication WOULD change the result:
  // gel has flowFactor 1.3. If we multiplied: remaining = 1000 × (1.3 × 1.0) = 1300 (WRONG).
  // Correct: remaining = 1000, usable = 1000 / 1.3 ≈ 769.
  const gelResult = calculatePrediction({
    totalWritingLengthMeters: 1000,
    flowCategory: "gel",
    inkRating: 10,
    writingStyle: "normal",
    notebookType: "queen_book",
  });
  assertEqual(gelResult.remainingDistanceMeters, 1000, "gel: remaining = total (not multiplied by 1.3)");
  assertClose(gelResult.usableDistanceMeters, 769, "gel: usable ≈ 769 (divided by 1.3, not multiplied)");
});

// ─── resolveWritingLength ─────────────────────────────────────────────────────

describe("resolveWritingLength: manufacturer claim takes precedence", () => {
  const r = resolveWritingLength(3000, "normal_ballpoint");
  assertEqual(r.totalWritingLengthMeters, 3000, "uses manufacturer claim");
  assertEqual(r.isFallbackEstimate, false, "isFallbackEstimate = false");
});

describe("resolveWritingLength: null → category fallback", () => {
  const r = resolveWritingLength(null, "liquid_rollerball");
  assertEqual(r.totalWritingLengthMeters, CATEGORY_FALLBACK_METRES.liquid_rollerball, "uses category fallback");
  assertEqual(r.isFallbackEstimate, true, "isFallbackEstimate = true");
});

describe("resolveWritingLength: undefined → category fallback", () => {
  const r = resolveWritingLength(undefined, "gel");
  assertEqual(r.totalWritingLengthMeters, CATEGORY_FALLBACK_METRES.gel, "uses gel fallback");
  assertEqual(r.isFallbackEstimate, true, "isFallbackEstimate = true");
});

describe("resolveWritingLength: 0 treated as missing claim → fallback", () => {
  const r = resolveWritingLength(0, "normal_ballpoint");
  assertEqual(r.isFallbackEstimate, true, "0m treated as missing claim → isFallbackEstimate = true");
  assertEqual(r.totalWritingLengthMeters, CATEGORY_FALLBACK_METRES.normal_ballpoint, "uses normal_ballpoint fallback");
});

describe("resolveWritingLength: unknown category → DEFAULT_FALLBACK_METRES (1500m)", () => {
  const r = resolveWritingLength(null, "mystery_pen");
  assertEqual(r.totalWritingLengthMeters, DEFAULT_FALLBACK_METRES, `default fallback = ${DEFAULT_FALLBACK_METRES}m`);
  assertEqual(r.isFallbackEstimate, true, "isFallbackEstimate = true");
});

describe("resolveWritingLength: all defined fallback categories have positive values", () => {
  for (const [cat, metres] of Object.entries(CATEGORY_FALLBACK_METRES)) {
    assert(metres > 0, `${cat} fallback = ${metres}m > 0`);
    const r = resolveWritingLength(null, cat);
    assertEqual(r.totalWritingLengthMeters, metres, `${cat}: fallback matches CATEGORY_FALLBACK_METRES`);
    assertEqual(r.isFallbackEstimate, true, `${cat}: isFallbackEstimate = true`);
  }
});

describe("resolveWritingLength: positive claim value always wins over fallback", () => {
  for (const cat of Object.keys(CATEGORY_FALLBACK_METRES)) {
    const r = resolveWritingLength(9999, cat);
    assertEqual(r.totalWritingLengthMeters, 9999, `${cat}: claim 9999 wins`);
    assertEqual(r.isFallbackEstimate, false, `${cat}: isFallbackEstimate = false`);
  }
});

// ─── resolveConfidence ────────────────────────────────────────────────────────

describe("resolveConfidence all branches", () => {
  // Fallback → always low regardless of penModel link
  assertEqual(resolveConfidence(true, true), "low", "fallback + known pen → low");
  assertEqual(resolveConfidence(true, false), "low", "fallback + unknown pen → low");

  // Manufacturer claim + known pen → medium
  assertEqual(resolveConfidence(false, true), "medium", "manufacturer claim + known pen → medium");

  // Manufacturer claim + NO known pen (manual entry matched nothing) → low
  assertEqual(resolveConfidence(false, false), "low", "manufacturer claim + no pen link → low");
});

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n${"─".repeat(60)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  console.error(`\n❌ ${failed} test(s) FAILED:`);
  for (const f of failures) {
    console.error(`  ${f}`);
  }
  throw new Error(`${failed} test(s) failed`);
} else {
  console.log(`\n✅ All ${passed} tests passed`);
}
