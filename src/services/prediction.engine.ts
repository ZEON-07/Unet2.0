/**
 * InkLife Prediction Engine v2.0.0
 *
 * All functions here are PURE (no I/O, no side effects).
 * This file is fully unit-testable without any Worker/D1 context.
 *
 * Critical accuracy rules enforced:
 *  1. Manufacturer's total writing-length claim already incorporates its native flow.
 *  2. Never multiply the manufacturer claim by its own flow rate again.
 *  3. flowCategory is used only as a consumption-correction divisor.
 *  4. Never invent exact writing-length claims – use category fallbacks with low confidence.
 */

import type { WritingStyle, NotebookType } from "../validators/prediction.validators";

// ─── Constants ────────────────────────────────────────────────────────────────

/** ENGINE_VERSION is embedded in every persisted prediction for traceability. */
export const ENGINE_VERSION = "2.0.0";

/**
 * Flow category consumption correction factors.
 * Higher factor → faster ink consumption → fewer usable metres from the same ink.
 * Note: fiber_tip and felt_tip are mapped to the "low_flow" factor (0.85)
 * because they typically have lower ink consumption relative to rated distance.
 */
export const FLOW_FACTORS: Record<string, number> = {
  normal_ballpoint: 1.0,
  smooth_low_viscosity: 1.15,
  gel: 1.3,
  liquid_rollerball: 1.45,
  // low-flow variants
  fiber_tip: 0.85,
  felt_tip: 0.85,
};

/** Default flow factor for unknown/unlisted categories. */
export const DEFAULT_FLOW_FACTOR = 1.0;

export const WRITING_STYLE_FACTORS: Record<WritingStyle, number> = {
  light: 0.85,
  normal: 1.0,
  heavy: 1.25,
};

export const NOTEBOOK_FACTORS: Record<NotebookType, number> = {
  long_book: 0.85,
  queen_book: 1.0,
  king_book: 1.2,
};

/** Metres of writing per queen-book page (baseline). */
export const METRES_PER_QUEEN_PAGE = 4;

/**
 * Category-based fallback writing-length estimates (metres).
 * Used when no manufacturer claim is available.
 * These are conservative mid-range estimates — mark isFallbackEstimate: true.
 */
export const CATEGORY_FALLBACK_METRES: Record<string, number> = {
  normal_ballpoint: 2000,
  liquid_rollerball: 5000,
  smooth_low_viscosity: 1500,
  gel: 1200,
  fiber_tip: 800,
  felt_tip: 600,
};

/** Default fallback when category is unknown. */
export const DEFAULT_FALLBACK_METRES = 1500;

// ─── Input / Output types ─────────────────────────────────────────────────────

export type PredictionEngineInput = {
  totalWritingLengthMeters: number;
  flowCategory: string;
  inkRating: number; // 0–10
  writingStyle: WritingStyle;
  notebookType: NotebookType;
};

export type PageEstimates = {
  longBook: number;
  queenBook: number;
  kingBook: number;
};

export type PredictionEngineResult = {
  inkFraction: number;
  inkPercentage: number;
  remainingDistanceMeters: number;
  usableDistanceMeters: number;
  pageEstimates: PageEstimates;
  estimatedPages: number;
  flowFactor: number;
  writingStyleFactor: number;
};

// ─── Pure helper functions ────────────────────────────────────────────────────

/** Get the flow factor for a given flow category. */
export function getFlowFactor(flowCategory: string): number {
  return FLOW_FACTORS[flowCategory] ?? DEFAULT_FLOW_FACTOR;
}

/** Get the writing style factor. */
export function getWritingStyleFactor(writingStyle: WritingStyle): number {
  return WRITING_STYLE_FACTORS[writingStyle];
}

/** Get the notebook factor. */
export function getNotebookFactor(notebookType: NotebookType): number {
  return NOTEBOOK_FACTORS[notebookType];
}

/**
 * Calculate pages for a specific notebook type from usable distance.
 * pages = usableDistanceMeters / (METRES_PER_QUEEN_PAGE * notebookFactor)
 * Rounded to nearest integer.
 */
export function calcPages(usableDistanceMeters: number, notebookType: NotebookType): number {
  const factor = NOTEBOOK_FACTORS[notebookType];
  return Math.round(usableDistanceMeters / (METRES_PER_QUEEN_PAGE * factor));
}

/**
 * Core prediction calculation. All inputs must be validated before calling.
 *
 * Formula:
 *   inkFraction               = inkRating / 10
 *   remainingDistanceMeters   = totalWritingLengthMeters × inkFraction
 *   usableDistanceMeters      = remainingDistanceMeters / (flowFactor × writingStyleFactor)
 *   longBookPages             = usableDistanceMeters / (4 × 0.85)
 *   queenBookPages            = usableDistanceMeters / (4 × 1.0)
 *   kingBookPages             = usableDistanceMeters / (4 × 1.2)
 *   estimatedPages            = pages for the requested notebookType
 */
export function calculatePrediction(input: PredictionEngineInput): PredictionEngineResult {
  const { totalWritingLengthMeters, flowCategory, inkRating, writingStyle, notebookType } = input;

  const inkFraction = inkRating / 10;
  const inkPercentage = inkRating * 10;

  const flowFactor = getFlowFactor(flowCategory);
  const writingStyleFactor = getWritingStyleFactor(writingStyle);

  const remainingDistanceMeters = totalWritingLengthMeters * inkFraction;
  const usableDistanceMeters = remainingDistanceMeters / (flowFactor * writingStyleFactor);

  const pageEstimates: PageEstimates = {
    longBook: calcPages(usableDistanceMeters, "long_book"),
    queenBook: calcPages(usableDistanceMeters, "queen_book"),
    kingBook: calcPages(usableDistanceMeters, "king_book"),
  };

  const notebookMap: Record<NotebookType, keyof PageEstimates> = {
    long_book: "longBook",
    queen_book: "queenBook",
    king_book: "kingBook",
  };
  const estimatedPages = pageEstimates[notebookMap[notebookType]];

  return {
    inkFraction,
    inkPercentage,
    remainingDistanceMeters: Math.round(remainingDistanceMeters),
    usableDistanceMeters: Math.round(usableDistanceMeters),
    pageEstimates,
    estimatedPages,
    flowFactor,
    writingStyleFactor,
  };
}

/**
 * Determine the writing-length source for a pen.
 * Returns the manufacturer's claimed length if available, otherwise falls back
 * to a category estimate and sets isFallbackEstimate: true.
 */
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

/**
 * Determine confidence level based on available data quality.
 */
export function resolveConfidence(
  isFallbackEstimate: boolean,
  hasPenModel: boolean
): "low" | "medium" | "high" | "very_high" {
  if (isFallbackEstimate) return "low";
  if (hasPenModel) return "medium";
  return "low";
}
