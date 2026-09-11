/**
 * Brand routes
 *
 * GET /api/brands                    → list all brands alphabetically
 * GET /api/brands/:brandId/models    → list models for a brand (404 if missing)
 */

import { Hono } from "hono";
import { zValidator } from "../utils/zValidator";
import type { HonoEnv } from "../types/bindings";
import { createDb } from "../repositories/db";
import * as brandService from "../services/brand.service";
import * as penService from "../services/pen.service";
import { brandIdParamSchema } from "../validators/pen.validators";

const brands = new Hono<HonoEnv>();

// ─── GET /api/brands ──────────────────────────────────────────────────────────

brands.get("/", async (c) => {
  const db = createDb(c.env.DB);
  const data = await brandService.getAllBrands(db);

  return c.json({
    success: true,
    data,
    meta: { count: data.length },
    requestId: c.get("requestId"),
  });
});

// ─── GET /api/brands/:brandId/models ─────────────────────────────────────────

brands.get(
  "/:brandId/models",
  zValidator("param", brandIdParamSchema),
  async (c) => {
    const { brandId } = c.req.valid("param");
    const db = createDb(c.env.DB);
    const data = await penService.getModelsByBrand(db, brandId);

    return c.json({
      success: true,
      data,
      meta: { count: data.length },
      requestId: c.get("requestId"),
    });
  }
);

export { brands as brandsRoute };
