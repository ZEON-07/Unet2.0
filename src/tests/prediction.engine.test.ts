/**
 * Unit tests for the InkLife Prediction Engine v2.1.0
 *
 * Run with:  npm test
 *            (or: npx tsx src/tests/prediction.engine.test.ts)
 */

import {
  calculateInkPrediction,
  calculatePrediction,
  resolveWritingLength,
  resolveConfidence,
  getFlowFactor,
  getWritingStyleFactor,
  calculatePageEstimates,
  getSelectedPageEstimate,
  BOOK_CONFIG,
  REAL_WORLD_EFFICIENCY,
  FLOW_FACTORS,
  WRITING_STYLE_FACTORS,
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

function assertGt(a: number, b: number, message: string): void {
  assert(a > b, `${message} — expected ${a} > ${b}`);
}

function assertLt(a: number, b: number, message: string): void {
  assert(a < b, `${message} — expected ${a} < ${b}`);
}

function describe(name: string, fn: () => void): void {
  console.log(`\n📋 ${name}`);
  fn();
}

// ─── Constants sanity ─────────────────────────────────────────────────────────

describe("ENGINE_VERSION & Physical Constants", () => {
  assert(typeof ENGINE_VERSION === "string" && ENGINE_VERSION.length > 0, `ENGINE_VERSION is a non-empty string (${ENGINE_VERSION})`);
  assertEqual(calculatePrediction, calculateInkPrediction, "calculatePrediction is alias of calculateInkPrediction");
  assertEqual(REAL_WORLD_EFFICIENCY, 0.85, "REAL_WORLD_EFFICIENCY is 0.85");
  assertEqual(BOOK_CONFIG.long_book.estimatedWritingMetresPerPage, 7.2, "Long Book requires 7.2m per page");
  assertEqual(BOOK_CONFIG.queen_book.estimatedWritingMetresPerPage, 6, "Queen Book requires 6m per page");
  assertEqual(BOOK_CONFIG.king_book.estimatedWritingMetresPerPage, 4.8, "King Book requires 4.8m per page");
});

describe("WRITING_STYLE_FACTORS exact values", () => {
  assertEqual(WRITING_STYLE_FACTORS.light, 0.9, "light = 0.9");
  assertEqual(WRITING_STYLE_FACTORS.normal, 1.0, "normal = 1.0");
  assertEqual(WRITING_STYLE_FACTORS.heavy, 1.2, "heavy = 1.2");
});

describe("FLOW_FACTORS exact values", () => {
  assertEqual(FLOW_FACTORS.low_flow, 0.9, "low_flow = 0.9");
  assertEqual(FLOW_FACTORS.normal_ballpoint, 1.0, "normal_ballpoint = 1.0");
  assertEqual(FLOW_FACTORS.smooth_low_viscosity, 1.1, "smooth_low_viscosity = 1.1");
  assertEqual(FLOW_FACTORS.gel, 1.25, "gel = 1.25");
  assertEqual(FLOW_FACTORS.liquid_rollerball, 1.35, "liquid_rollerball = 1.35");
});

// ─── SPEC REQUIREMENT: BIC Cristal Original 3000m, 9% ink, Normal writing ────

describe("SPEC REQUIREMENT: BIC Cristal Original (3000m, 9% ink, Normal, Queen Book)", () => {
  const result = calculateInkPrediction({
    claimedWritingDistanceMeters: 3000,
    inkPercentage: 9,
    writingStyle: "normal",
    selectedNotebook: "queen_book",
  });

  assertEqual(result.inkPercentage, 9, "Exact slider percentage preserved (9%, NOT rounded to 10%)");
  assertEqual(result.remainingDistanceMeters, 270, "Remaining Distance: 3000m × 0.09 = 270m");
  assertEqual(result.usableDistanceMeters, 230, "Usable Writing Distance: 270m × 0.85 = 229.5m → 230m");
  assertEqual(result.pageEstimates.longBook, 31, "Long Book: 229.5 ÷ 7.2 = 31 pages (Math.floor)");
  assertEqual(result.pageEstimates.queenBook, 38, "Queen Book: 229.5 ÷ 6.0 = 38 pages (Math.floor)");
  assertEqual(result.pageEstimates.kingBook, 47, "King Book: 229.5 ÷ 4.8 = 47 pages (Math.floor)");
  assertEqual(result.selectedPages, 38, "Large main result for Queen Book shows 38 pages");
  assertEqual(result.estimatedPages, 38, "estimatedPages alias matches selectedPages");

  // If user selects Long Book
  const resultLong = calculateInkPrediction({
    claimedWritingDistanceMeters: 3000,
    inkPercentage: 9,
    writingStyle: "normal",
    selectedNotebook: "long_book",
  });
  assertEqual(resultLong.selectedPages, 31, "Large main result for Long Book shows 31 pages");

  // If user selects King Book
  const resultKing = calculateInkPrediction({
    claimedWritingDistanceMeters: 3000,
    inkPercentage: 9,
    writingStyle: "normal",
    selectedNotebook: "king_book",
  });
  assertEqual(resultKing.selectedPages, 47, "Large main result for King Book shows 47 pages");
});

// ─── SPEC REQUIREMENT: 0% returns 0 for every result ─────────────────────────

describe("SPEC REQUIREMENT: 0% returns 0 for every result", () => {
  const result = calculateInkPrediction({
    claimedWritingDistanceMeters: 3000,
    inkPercentage: 0,
    writingStyle: "normal",
    selectedNotebook: "queen_book",
  });

  assertEqual(result.remainingDistanceMeters, 0, "0% ink → 0m remaining distance");
  assertEqual(result.usableDistanceMeters, 0, "0% ink → 0m usable distance");
  assertEqual(result.pageEstimates.longBook, 0, "0% ink → 0 Long Book pages");
  assertEqual(result.pageEstimates.queenBook, 0, "0% ink → 0 Queen Book pages");
  assertEqual(result.pageEstimates.kingBook, 0, "0% ink → 0 King Book pages");
  assertEqual(result.selectedPages, 0, "0% ink → 0 selected pages");
});

// ─── SPEC REQUIREMENT: 100% returns valid values ─────────────────────────────

describe("SPEC REQUIREMENT: 100% returns valid values", () => {
  const result = calculateInkPrediction({
    claimedWritingDistanceMeters: 3000,
    inkPercentage: 100,
    writingStyle: "normal",
    selectedNotebook: "queen_book",
  });

  assertEqual(result.remainingDistanceMeters, 3000, "100% ink → 3000m remaining distance");
  // 3000 × 0.85 = 2550m
  assertEqual(result.usableDistanceMeters, 2550, "100% ink → 2550m usable distance");
  // 2550 / 7.2 = 354.16 → 354
  assertEqual(result.pageEstimates.longBook, 354, "100% ink → 354 Long Book pages");
  // 2550 / 6 = 425
  assertEqual(result.pageEstimates.queenBook, 425, "100% ink → 425 Queen Book pages");
  // 2550 / 4.8 = 531.25 → 531
  assertEqual(result.pageEstimates.kingBook, 531, "100% ink → 531 King Book pages");
  assertEqual(result.selectedPages, 425, "100% ink → 425 selected pages");
  assert(Number.isFinite(result.usableDistanceMeters), "usable distance is finite");
});

// ─── SPEC REQUIREMENT: Heavy writing returns fewer pages than Normal ──────────

describe("SPEC REQUIREMENT: Heavy writing returns fewer pages than Normal", () => {
  const normal = calculateInkPrediction({
    claimedWritingDistanceMeters: 3000,
    inkPercentage: 9,
    writingStyle: "normal",
    selectedNotebook: "queen_book",
  });

  const heavy = calculateInkPrediction({
    claimedWritingDistanceMeters: 3000,
    inkPercentage: 9,
    writingStyle: "heavy",
    selectedNotebook: "queen_book",
  });

  assertGt(normal.usableDistanceMeters, heavy.usableDistanceMeters, "normal usable (230) > heavy usable (191)");
  assertGt(normal.pageEstimates.longBook, heavy.pageEstimates.longBook, "normal longBook (31) > heavy longBook (26)");
  assertGt(normal.pageEstimates.queenBook, heavy.pageEstimates.queenBook, "normal queenBook (38) > heavy queenBook (31)");
  assertGt(normal.pageEstimates.kingBook, heavy.pageEstimates.kingBook, "normal kingBook (47) > heavy kingBook (39)");
});

// ─── SPEC REQUIREMENT: Light writing returns more pages than Normal ───────────

describe("SPEC REQUIREMENT: Light writing returns more pages than Normal", () => {
  const normal = calculateInkPrediction({
    claimedWritingDistanceMeters: 3000,
    inkPercentage: 9,
    writingStyle: "normal",
    selectedNotebook: "queen_book",
  });

  const light = calculateInkPrediction({
    claimedWritingDistanceMeters: 3000,
    inkPercentage: 9,
    writingStyle: "light",
    selectedNotebook: "queen_book",
  });

  assertGt(light.usableDistanceMeters, normal.usableDistanceMeters, "light usable (255) > normal usable (230)");
  assertGt(light.pageEstimates.longBook, normal.pageEstimates.longBook, "light longBook (35) > normal longBook (31)");
  assertGt(light.pageEstimates.queenBook, normal.pageEstimates.queenBook, "light queenBook (42) > normal queenBook (38)");
  assertGt(light.pageEstimates.kingBook, normal.pageEstimates.kingBook, "light kingBook (53) > normal kingBook (47)");
});

// ─── SPEC REQUIREMENT: Result headline always matches the selected notebook card ─

describe("SPEC REQUIREMENT: Result headline always matches the selected notebook card", () => {
  const base = {
    claimedWritingDistanceMeters: 2500,
    inkPercentage: 50,
    writingStyle: "normal" as WritingStyle,
  };

  const notebooks: NotebookType[] = ["long_book", "queen_book", "king_book"];
  for (const nb of notebooks) {
    const res = calculateInkPrediction({ ...base, selectedNotebook: nb });
    const directSelected = getSelectedPageEstimate(nb, res.pageEstimates);
    assertEqual(res.selectedPages, directSelected, `selectedPages matches getSelectedPageEstimate for ${nb}`);
    if (nb === "long_book") {
      assertEqual(res.selectedPages, res.pageEstimates.longBook, "long_book matches pageEstimates.longBook");
    } else if (nb === "queen_book") {
      assertEqual(res.selectedPages, res.pageEstimates.queenBook, "queen_book matches pageEstimates.queenBook");
    } else if (nb === "king_book") {
      assertEqual(res.selectedPages, res.pageEstimates.kingBook, "king_book matches pageEstimates.kingBook");
    }
  }
});

// ─── SPEC REQUIREMENT: Slider percentage, remaining-distance label, and calculation use the same value ─

describe("SPEC REQUIREMENT: Exact slider percentage used without rounding 9% to 10%", () => {
  for (const percent of [1, 9, 14, 27, 65, 99]) {
    const res = calculateInkPrediction({
      claimedWritingDistanceMeters: 3000,
      inkPercentage: percent,
      writingStyle: "normal",
      selectedNotebook: "queen_book",
    });

    assertEqual(res.inkPercentage, percent, `inkPercentage exactly matches slider value ${percent}%`);
    const expectedRemaining = Math.round(3000 * (percent / 100));
    assertEqual(res.remainingDistanceMeters, expectedRemaining, `remainingDistance matches exact ${percent}% (${expectedRemaining}m)`);
  }
});

// ─── SPEC REQUIREMENT: Long < Queen < King for every valid input ─────────────

describe("SPEC REQUIREMENT: Long Book < Queen Book < King Book for every valid input", () => {
  const testCases = [
    { distance: 1000, percent: 10 },
    { distance: 1500, percent: 25 },
    { distance: 2000, percent: 50 },
    { distance: 3000, percent: 9 },
    { distance: 3000, percent: 100 },
    { distance: 10000, percent: 75 },
  ];

  for (const tc of testCases) {
    const res = calculateInkPrediction({
      claimedWritingDistanceMeters: tc.distance,
      inkPercentage: tc.percent,
      writingStyle: "normal",
      selectedNotebook: "queen_book",
    });

    assertLt(res.pageEstimates.longBook, res.pageEstimates.queenBook, `${tc.distance}m @ ${tc.percent}%: longBook (${res.pageEstimates.longBook}) < queenBook (${res.pageEstimates.queenBook})`);
    assertLt(res.pageEstimates.queenBook, res.pageEstimates.kingBook, `${tc.distance}m @ ${tc.percent}%: queenBook (${res.pageEstimates.queenBook}) < kingBook (${res.pageEstimates.kingBook})`);
  }
});

// ─── FLOW RULE: Verified claim does not re-apply flow factor ─────────────────

describe("FLOW RULE: Do not apply flow factor to verified manufacturer writing-distance claims", () => {
  // Pilot V5 is liquid rollerball. Its 1800m is already the measured rollerball length.
  const claimRes = calculateInkPrediction({
    claimedWritingDistanceMeters: 1800,
    flowCategory: "liquid_rollerball",
    inkPercentage: 100,
    writingStyle: "normal",
    selectedNotebook: "queen_book",
    claimAlreadyIncludesNativeFlow: true,
  });

  // Usable should be 1800 × 0.85 = 1530m (no extra 1.35 divisor)
  assertEqual(claimRes.usableDistanceMeters, 1530, "Claim with flow included: 1800 × 0.85 = 1530m (no double flow penalty)");

  // Unknown pen fallback without manufacturer claim: applies fallbackFlowFactor (1.35)
  const fallbackRes = calculateInkPrediction({
    claimedWritingDistanceMeters: 1800,
    flowCategory: "liquid_rollerball",
    inkPercentage: 100,
    writingStyle: "normal",
    selectedNotebook: "queen_book",
    claimAlreadyIncludesNativeFlow: false,
  });

  // 1800 × 0.85 / 1.35 = 1133.33 → 1133m
  assertEqual(fallbackRes.usableDistanceMeters, 1133, "Fallback without claim: applies flow adjustment (1133m)");
});

// ─── Safety Rules ─────────────────────────────────────────────────────────────

describe("Safety Rules: Clamped percentages and robustness", () => {
  const rHigh = calculateInkPrediction({
    claimedWritingDistanceMeters: 1000,
    inkPercentage: 150,
    writingStyle: "normal",
    selectedNotebook: "queen_book",
  });
  assertEqual(rHigh.inkPercentage, 100, "Percentage 150 clamped to 100");

  const rNeg = calculateInkPrediction({
    claimedWritingDistanceMeters: 1000,
    inkPercentage: -20,
    writingStyle: "normal",
    selectedNotebook: "queen_book",
  });
  assertEqual(rNeg.inkPercentage, 0, "Percentage -20 clamped to 0");
  assertEqual(rNeg.usableDistanceMeters, 0, "usable is 0");
  assertEqual(rNeg.selectedPages, 0, "pages is 0");

  assertEqual(getWritingStyleFactor("unknown" as any), 1.0, "unknown writingStyle defaults to 1.0");
  assertEqual(getFlowFactor("unknown_category"), 1.0, "unknown flowCategory defaults to 1.0");

  const est = calculatePageEstimates(230);
  assertEqual(est.queenBook, 38, "calculatePageEstimates(230) uses Math.floor");
});

// ─── resolveWritingLength & resolveConfidence ─────────────────────────────────

describe("resolveWritingLength & resolveConfidence", () => {
  assertEqual(CATEGORY_FALLBACK_METRES.gel, 1200, "CATEGORY_FALLBACK_METRES.gel is 1200m");
  assertEqual(DEFAULT_FALLBACK_METRES, 1500, "DEFAULT_FALLBACK_METRES is 1500m");

  const rClaim = resolveWritingLength(2500, "normal_ballpoint");
  assertEqual(rClaim.totalWritingLengthMeters, 2500, "uses manufacturer claim");
  assertEqual(rClaim.isFallbackEstimate, false, "isFallbackEstimate = false");

  const rFallback = resolveWritingLength(null, "gel");
  assertEqual(rFallback.totalWritingLengthMeters, 1200, "uses category fallback");
  assertEqual(rFallback.isFallbackEstimate, true, "isFallbackEstimate = true");

  assertEqual(resolveConfidence(false, true), "medium", "claim + pen model → medium confidence");
  assertEqual(resolveConfidence(true, false), "low", "fallback → low confidence");
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
