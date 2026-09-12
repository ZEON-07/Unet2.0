/**
 * Prediction service – orchestrates pen lookup, engine calculation, and DB persistence.
 */

import type { DrizzleDb } from "../repositories/db";
import * as predictionRepo from "../repositories/prediction.repository";
import * as penRepo from "../repositories/pen.repository";
import * as brandRepo from "../repositories/brand.repository";
import {
  calculatePrediction,
  resolveWritingLength,
  resolveConfidence,
  ENGINE_VERSION,
} from "./prediction.engine";
import type { CreatePredictionBody } from "../validators/prediction.validators";
import { NotFoundError, ValidationError } from "../utils/errors";
import { parseJson } from "../lib/prisma";

// ─── Response DTO ─────────────────────────────────────────────────────────────

export type PredictionSource = {
  title: string;
  url: string | null;
  checkedAt: string;
};

export type PredictionResponseDto = {
  id: string;
  penName: string;
  inkRating: number;
  inkPercentage: number;
  totalWritingLengthMeters: number;
  remainingDistanceMeters: number;
  usableDistanceMeters: number;
  estimatedPages: number;
  pageEstimates: { longBook: number; queenBook: number; kingBook: number };
  flowCategory: string;
  writingStyle: string;
  notebookType: string;
  confidence: "low" | "medium" | "high" | "very_high";
  isFallbackEstimate: boolean;
  fallbackNotes: string | null;
  source: PredictionSource | null;
  computedAt: string;
};

// ─── Resolve pen info ─────────────────────────────────────────────────────────

type ResolvedPen = {
  penModelId: string | null;
  penName: string;
  flowCategory: string;
  nominalMileageM: number | null;
};

async function resolvePen(
  db: DrizzleDb,
  body: CreatePredictionBody
): Promise<ResolvedPen> {
  // Case 1: explicit penModelId — must exist in DB
  if (body.penModelId) {
    const pen = await penRepo.findPenByIdOrSlug(db, body.penModelId);
    if (!pen) throw new NotFoundError("PenModel", body.penModelId);
    return {
      penModelId: pen.id,
      penName: `${pen.brandName} ${pen.name}`,
      flowCategory: pen.flowCategory,
      nominalMileageM: pen.nominalMileageM,
    };
  }

  // Case 2: manual brand + model name — try fuzzy match in DB
  const enteredBrand = body.enteredBrand!;
  const enteredModel = body.enteredModel!;

  // findBrandByNameLike now wraps `%…%` internally
  const brand = await brandRepo.findBrandByNameLike(db, enteredBrand);

  if (brand) {
    const models = await penRepo.findModelsByBrandId(db, brand.id);
    const normalised = enteredModel.toLowerCase();
    const matched = models.find(
      (m) =>
        m.name.toLowerCase().includes(normalised) ||
        normalised.includes(m.name.toLowerCase())
    );
    if (matched) {
      return {
        penModelId: matched.id,
        penName: `${matched.brandName} ${matched.name}`,
        flowCategory: matched.flowCategory,
        nominalMileageM: matched.nominalMileageM,
      };
    }
  }

  // No match — unlinked pen with conservative defaults
  return {
    penModelId: null,
    penName: `${enteredBrand} ${enteredModel}`,
    flowCategory: "normal_ballpoint",
    nominalMileageM: null,
  };
}

// ─── Main service function ────────────────────────────────────────────────────

export async function createPrediction(
  db: DrizzleDb,
  body: CreatePredictionBody
): Promise<PredictionResponseDto> {
  // 1. Resolve pen
  const pen = await resolvePen(db, body);

  // 2. Resolve writing length + fallback flag
  const { totalWritingLengthMeters, isFallbackEstimate } = resolveWritingLength(
    pen.nominalMileageM,
    pen.flowCategory
  );

  // 3. Run pure engine
  const calc = calculatePrediction({
    totalWritingLengthMeters,
    flowCategory: pen.flowCategory,
    inkPercentage: body.inkPercentage,
    inkRating: body.inkRating,
    writingStyle: body.writingStyle,
    notebookType: body.notebookType,
    claimAlreadyIncludesNativeFlow: !isFallbackEstimate,
  });

  // 4. Determine confidence
  const confidence = resolveConfidence(isFallbackEstimate, pen.penModelId !== null);

  // 5. Fetch source (best-effort, non-blocking)
  let source: PredictionSource | null = null;
  if (pen.penModelId) {
    source = await predictionRepo.findSourceForPenModel(db, pen.penModelId);
  }

  // 6. Build response DTO
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  const dto: PredictionResponseDto = {
    id,
    penName: pen.penName,
    inkRating: calc.inkRating,
    inkPercentage: calc.inkPercentage,
    totalWritingLengthMeters,
    remainingDistanceMeters: calc.remainingDistanceMeters,
    usableDistanceMeters: calc.usableDistanceMeters,
    estimatedPages: calc.estimatedPages,
    pageEstimates: calc.pageEstimates,
    flowCategory: pen.flowCategory,
    writingStyle: body.writingStyle,
    notebookType: body.notebookType,
    confidence,
    isFallbackEstimate,
    fallbackNotes: isFallbackEstimate
      ? `No manufacturer claim found for this pen. Estimate based on typical ${pen.flowCategory.replace(/_/g, " ")} pen (${totalWritingLengthMeters}m category average).`
      : null,
    source,
    computedAt: now,
  };

  // 7. Persist to D1
  await predictionRepo.insertPrediction(db, {
    id,
    penModelId: pen.penModelId ?? null,
    predictedMileageM: calc.usableDistanceMeters,
    confidence,
    modelVersion: ENGINE_VERSION,
    sampleSize: 0,
    resultJson: JSON.stringify(dto),
    metadata: JSON.stringify({
      enteredBrand: body.enteredBrand,
      enteredModel: body.enteredModel,
      writingStyle: body.writingStyle,
      notebookType: body.notebookType,
      inkPercentage: calc.inkPercentage,
      inkRating: calc.inkRating,
      isFallbackEstimate,
    }),
  });

  return dto;
}

export async function getPrediction(
  db: DrizzleDb,
  predictionId: string
): Promise<PredictionResponseDto> {
  const row = await predictionRepo.findPredictionById(db, predictionId);
  if (!row) throw new NotFoundError("Prediction", predictionId);

  if (!row.resultJson) {
    throw new ValidationError("Prediction record is missing result data");
  }

  return parseJson<PredictionResponseDto>(row.resultJson, {} as PredictionResponseDto);
}
