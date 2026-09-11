/**
 * Pen routes
 *
 * GET /api/pens/search    → paginated search with filters
 * GET /api/pens/:penId    → full detail for a single pen model
 *
 * NOTE: /search MUST be declared before /:penId so Hono doesn't swallow
 * the literal "search" as a dynamic segment value.
 */

import { Hono } from "hono";
import { zValidator } from "../utils/zValidator";
import type { HonoEnv } from "../types/bindings";
import { createDb } from "../repositories/db";
import * as penService from "../services/pen.service";
import {
  penIdParamSchema,
  penSearchQuerySchema,
} from "../validators/pen.validators";

const pens = new Hono<HonoEnv>();

// ─── GET /api/pens and GET /api/pens/search ───────────────────────────────────

const handleSearch = async (c: any) => {
  const query = c.req.valid("query");
  const db = createDb(c.env.DB);
  const result = await penService.searchPens(db, query);

  return c.json({
    success: true,
    data: result.items,
    pagination: result.pagination,
    requestId: c.get("requestId"),
  });
};

pens.get("/", zValidator("query", penSearchQuerySchema), handleSearch);
pens.get("/search", zValidator("query", penSearchQuerySchema), handleSearch);

// ─── GET /api/pens/:penId ─────────────────────────────────────────────────────

pens.get(
  "/:penId",
  zValidator("param", penIdParamSchema),
  async (c) => {
    const { penId } = c.req.valid("param");
    const db = createDb(c.env.DB);
    const data = await penService.getPenDetail(db, penId);

    return c.json({
      success: true,
      data,
      requestId: c.get("requestId"),
    });
  }
);

export { pens as pensRoute };
