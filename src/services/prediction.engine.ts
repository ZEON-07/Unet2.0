/**
 * InkLife Prediction Engine v2.1.0
 *
 * Core physical & handwriting calculation engine.
 * Converts ideal manufacturer claim conditions into realistic handwriting estimates.
 */

import type { WritingStyle, NotebookType } from "../validators/prediction.validators";

// ─── Constants ────────────────────────────────────────────────────────────────

export const ENGINE_VERSION = "2.1.0";

export const CLAIM_ALREADY_INCLUDES_NATIVE_FLOW = true;

export const WRITING_STYLE_FACTORS = {
  light: 0.9,
  normal: 1.0,
  heavy: 1.2,
} as const;

// Converts ideal manufacturer claim conditions into a realistic
// handwriting estimate. Do not remove this.
export const REAL_WORLD_EFFICIENCY = 0.85;

export const BOOK_CONFIG = {
  long_book: {
    label: "Long Book",
    linesPerPage: 30,
    estimatedWritingMetresPerPage: 7.2,
  },
  queen_book: {
    label: "Queen Book",
    linesPerPage: 25,
    estimatedWritingMetresPerPage: 6,
  },
  king_book: {
    label: "King Book",
    linesPerPage: 20,
    estimatedWritingMetresPerPage: 4.8,
  },
} as const;

export const FLOW_FACTORS: Record<string, number> = {
  low_flow: 0.9,
  normal_ballpoint: 1.0,
  smooth_low_viscosity: 1.1,
  gel: 1.25,
  liquid_rollerball: 1.35,
  fiber_tip: 0.9,
  felt_tip: 0.9,
};

export const DEFAULT_FLOW_FACTOR = 1.0;

export const CATEGORY_FALLBACK_METRES: Record<string, number> = {
  normal_ballpoint: 2000,
  liquid_rollerball: 5000,
  smooth_low_viscosity: 1500,
  gel: 1200,
  fiber_tip: 800,
  felt_tip: 600,
};

export const DEFAULT_FALLBACK_METRES = 1500;

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function safeNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export type PageEstimates = {
  longBook: number;
  queenBook: number;
  kingBook: number;
};

export function calculatePageEstimates(usableDistanceMeters: number): PageEstimates {
  const safeUsable = Math.max(0, safeNumber(usableDistanceMeters));
  return {
    longBook: Math.floor(
      safeUsable / BOOK_CONFIG.long_book.estimatedWritingMetresPerPage
    ),
    queenBook: Math.floor(
      safeUsable / BOOK_CONFIG.queen_book.estimatedWritingMetresPerPage
    ),
    kingBook: Math.floor(
      safeUsable / BOOK_CONFIG.king_book.estimatedWritingMetresPerPage
    ),
  };
}

export function getSelectedPageEstimate(
  notebookType: NotebookType | string,
  estimates: PageEstimates
): number {
  const map: Record<string, number> = {
    long_book: estimates.longBook,
    queen_book: estimates.queenBook,
    king_book: estimates.kingBook,
  };
  return map[notebookType] ?? estimates.queenBook;
}

export function getFlowFactor(flowCategory?: string): number {
  if (!flowCategory) return DEFAULT_FLOW_FACTOR;
  return FLOW_FACTORS[flowCategory] ?? DEFAULT_FLOW_FACTOR;
}

export function getWritingStyleFactor(writingStyle: WritingStyle): number {
  return WRITING_STYLE_FACTORS[writingStyle] ?? 1.0;
}

// ─── Calculation Input & Result ───────────────────────────────────────────────

export type PredictionEngineInput = {
  claimedWritingDistanceMeters?: number | undefined;
  totalWritingLengthMeters?: number | undefined;
  inkPercentage?: number | undefined;
  inkRating?: number | undefined;
  writingStyle: WritingStyle;
  selectedNotebook?: NotebookType | undefined;
  notebookType?: NotebookType | undefined;
  flowCategory?: string | undefined;
  claimAlreadyIncludesNativeFlow?: boolean | undefined;
};

export type PredictionEngineResult = {
  inkPercentage: number;
  inkFraction: number;
  inkRating: number;
  totalWritingLengthMeters: number;
  claimedWritingDistanceMeters: number;
  remainingDistanceMeters: number;
  usableDistanceMeters: number;
  pageEstimates: PageEstimates;
  selectedPages: number;
  estimatedPages: number;
  flowFactor: number;
  writingStyleFactor: number;
};

export function calculateInkPrediction(input: PredictionEngineInput): PredictionEngineResult {
  const rawPercentage =
    input.inkPercentage !== undefined
      ? input.inkPercentage
      : input.inkRating !== undefined
      ? input.inkRating * 10
      : 0;

  const safePercentage = Math.min(100, Math.max(0, safeNumber(rawPercentage)));

  const safeClaimedDistance = Math.max(
    0,
    safeNumber(input.claimedWritingDistanceMeters ?? input.totalWritingLengthMeters)
  );

  const writingStyle = input.writingStyle;
  const writingStyleFactor = WRITING_STYLE_FACTORS[writingStyle] ?? 1;

  const selectedNotebook = (input.selectedNotebook ?? input.notebookType ?? "queen_book") as NotebookType;

  // Exact distance represented by the visible ink percentage.
  const remainingDistanceMeters = safeClaimedDistance * (safePercentage / 100);

  // Flow adjustment: Do not apply flow factor to verified manufacturer claims.
  // Only use fallbackFlowFactor when estimating an unknown pen without a manufacturer claim.
  const claimAlreadyIncludesNativeFlow =
    input.claimAlreadyIncludesNativeFlow ?? CLAIM_ALREADY_INCLUDES_NATIVE_FLOW;
  const flowFactor = FLOW_FACTORS[input.flowCategory ?? "normal_ballpoint"] ?? 1;
  const flowAdjustment = claimAlreadyIncludesNativeFlow ? 1 : flowFactor;

  // Manufacturer claims are ideal test values.
  // Apply real-world handwriting efficiency.
  // Do not apply native ink-flow factor again because it is already
  // included in the manufacturer's writing-distance claim.
  const usableDistanceMeters =
    safePercentage === 0 || safeClaimedDistance === 0
      ? 0
      : (remainingDistanceMeters * REAL_WORLD_EFFICIENCY) /
        (writingStyleFactor * flowAdjustment);

  const pageEstimates = {
    longBook: Math.floor(
      usableDistanceMeters /
      BOOK_CONFIG.long_book.estimatedWritingMetresPerPage
    ),
    queenBook: Math.floor(
      usableDistanceMeters /
      BOOK_CONFIG.queen_book.estimatedWritingMetresPerPage
    ),
    kingBook: Math.floor(
      usableDistanceMeters /
      BOOK_CONFIG.king_book.estimatedWritingMetresPerPage
    ),
  };

  const selectedPagesMap = {
    long_book: pageEstimates.longBook,
    queen_book: pageEstimates.queenBook,
    king_book: pageEstimates.kingBook,
  };

  const selectedPages = selectedPagesMap[selectedNotebook] ?? pageEstimates.queenBook;

  return {
    inkPercentage: safePercentage,
    inkFraction: safePercentage / 100,
    inkRating: safePercentage / 10,
    totalWritingLengthMeters: safeClaimedDistance,
    claimedWritingDistanceMeters: safeClaimedDistance,
    remainingDistanceMeters: Math.round(remainingDistanceMeters),
    usableDistanceMeters: Math.round(Math.max(0, usableDistanceMeters)),
    pageEstimates,
    selectedPages,
    estimatedPages: selectedPages,
    flowFactor,
    writingStyleFactor,
  };
}

export const calculatePrediction = calculateInkPrediction;

// ─── Metadata & Fallback Resolvers ────────────────────────────────────────────

export function resolveWritingLength(
  nominalMileageM: number | null | undefined,
  flowCategory: string
): { totalWritingLengthMeters: number; isFallbackEstimate: boolean } {
  if (nominalMileageM !== null && nominalMileageM !== undefined && nominalMileageM > 0) {
    return { totalWritingLengthMeters: nominalMileageM, isFallbackEstimate: false };
  }
  const fallback = CATEGORY_FALLBACK_METRES[flowCategory] ?? DEFAULT_FALLBACK_METRES;
  return { totalWritingLengthMeters: fallback, isFallbackEstimate: true };
}

export function resolveConfidence(
  isFallbackEstimate: boolean,
  hasPenModel: boolean
): "low" | "medium" | "high" | "very_high" {
  if (isFallbackEstimate) return "low";
  if (hasPenModel) return "medium";
  return "low";
}
