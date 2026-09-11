/**
 * Prediction routes
 *
 * POST /api/predictions             → create and persist a new prediction
 * GET  /api/predictions/:predictionId → retrieve a stored prediction by ID
 */

import { Hono } from "hono";
import type { HonoEnv } from "../types/bindings";
import { createDb } from "../repositories/db";
import { zValidator } from "../utils/zValidator";
import * as predictionService from "../services/prediction.service";
import {
  createPredictionBodySchema,
  predictionIdParamSchema,
} from "../validators/prediction.validators";

const predictions = new Hono<HonoEnv>();

// ─── POST /api/predictions ────────────────────────────────────────────────────

predictions.post(
  "/",
  zValidator("json", createPredictionBodySchema),
  async (c) => {
    const body = c.req.valid("json");
    const db = createDb(c.env.DB);

    const data = await predictionService.createPrediction(db, body);

    return c.json(
      {
        success: true,
        data,
        requestId: c.get("requestId"),
      },
      201
    );
  }
);

// ─── GET /api/predictions/:predictionId ──────────────────────────────────────

predictions.get(
  "/:predictionId",
  zValidator("param", predictionIdParamSchema),
  async (c) => {
    const { predictionId } = c.req.valid("param");
    const db = createDb(c.env.DB);

    const data = await predictionService.getPrediction(db, predictionId);

    return c.json({
      success: true,
      data,
      requestId: c.get("requestId"),
    });
  }
);

export { predictions as predictionsRoute };
