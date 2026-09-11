/**
 * Prediction request body validator (Zod).
 */

import { z } from "zod";

export const WritingStyleEnum = z.enum(["light", "normal", "heavy"]);
export const NotebookTypeEnum = z.enum(["long_book", "queen_book", "king_book"]);

export type WritingStyle = z.infer<typeof WritingStyleEnum>;
export type NotebookType = z.infer<typeof NotebookTypeEnum>;

/** POST /api/predictions request body */
export const createPredictionBodySchema = z
  .object({
    /** UUID of a known pen model in the database (optional if enteredBrand + enteredModel given) */
    penModelId: z.string().uuid("penModelId must be a valid UUID").optional(),

    /** Manual brand name (used if penModelId is not provided) */
    enteredBrand: z.string().min(1).max(100).optional(),

    /** Manual model name (used if penModelId is not provided) */
    enteredModel: z.string().min(1).max(100).optional(),

    /** Exact remaining ink percentage 0–100 (e.g. 9 for 9%) */
    inkPercentage: z
      .number()
      .min(0, "inkPercentage must be >= 0")
      .max(100, "inkPercentage must be <= 100")
      .optional(),

    /** Remaining ink rating 0–10 (legacy or alternate) */
    inkRating: z
      .number()
      .min(0, "inkRating must be >= 0")
      .max(10, "inkRating must be <= 10")
      .optional(),

    /** How hard/fast the user writes */
    writingStyle: WritingStyleEnum,

    /** Type of notebook the user writes in */
    notebookType: NotebookTypeEnum,
  })
  .refine(
    (d) => d.penModelId !== undefined || (d.enteredBrand !== undefined && d.enteredModel !== undefined),
    {
      message: "Provide either penModelId or both enteredBrand and enteredModel",
      path: ["penModelId"],
    }
  )
  .refine(
    (d) => d.inkPercentage !== undefined || d.inkRating !== undefined,
    {
      message: "Provide either inkPercentage or inkRating",
      path: ["inkPercentage"],
    }
  );

export type CreatePredictionBody = z.infer<typeof createPredictionBodySchema>;

/** Path param for GET /api/predictions/:predictionId */
export const predictionIdParamSchema = z.object({
  predictionId: z.string().min(1, "predictionId is required"),
});
