/**
 * Admin routes
 *
 * All routes require a valid JWT (role === "admin").
 * Applied middleware per-route (not globally) so non-admin paths are unaffected.
 *
 * GET    /api/admin/claims/pending
 * PATCH  /api/admin/claims/:claimId
 * POST   /api/admin/pens
 * PATCH  /api/admin/pens/:penId
 * GET    /api/admin/search-lookups
 */

import { Hono } from "hono";
import type { HonoEnv } from "../types/bindings";
import { createDb } from "../repositories/db";
import { zValidator } from "../utils/zValidator";
import { jwtAuthMiddleware, adminGuard } from "../middleware/auth";
import * as adminService from "../services/admin.service";
import {
  claimIdParamSchema,
  patchClaimBodySchema,
  adminPenIdParamSchema,
  createPenBodySchema,
  patchPenBodySchema,
  searchLookupQuerySchema,
} from "../validators/admin.validators";

const admin = new Hono<HonoEnv>();

// ─── Apply JWT + admin guard to every route in this sub-app ───────────────────
admin.use("*", jwtAuthMiddleware());
admin.use("*", adminGuard());

// ─── GET /api/admin/claims/pending ────────────────────────────────────────────

admin.get("/claims/pending", async (c) => {
  const db = createDb(c.env.DB);
  const data = await adminService.getPendingClaims(db);

  return c.json({
    success: true,
    data,
    meta: { count: data.length },
    requestId: c.get("requestId"),
  });
});

// ─── PATCH /api/admin/claims/:claimId ────────────────────────────────────────

admin.patch(
  "/claims/:claimId",
  zValidator("param", claimIdParamSchema),
  zValidator("json", patchClaimBodySchema),
  async (c) => {
    const { claimId } = c.req.valid("param");
    const body = c.req.valid("json");
    const db = createDb(c.env.DB);
    const adminId = c.get("jwtUser").sub;
    const clientIp =
      c.req.header("CF-Connecting-IP") ??
      c.req.header("X-Forwarded-For")?.split(",")[0]?.trim() ??
      null;

    const data = await adminService.patchClaim(db, adminId, clientIp, claimId, body);

    return c.json({
      success: true,
      data,
      requestId: c.get("requestId"),
    });
  }
);

// ─── POST /api/admin/pens ─────────────────────────────────────────────────────

admin.post(
  "/pens",
  zValidator("json", createPenBodySchema),
  async (c) => {
    const body = c.req.valid("json");
    const db = createDb(c.env.DB);
    const adminId = c.get("jwtUser").sub;
    const clientIp =
      c.req.header("CF-Connecting-IP") ??
      c.req.header("X-Forwarded-For")?.split(",")[0]?.trim() ??
      null;

    const data = await adminService.createPen(db, adminId, clientIp, body);

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

// ─── PATCH /api/admin/pens/:penId ─────────────────────────────────────────────

admin.patch(
  "/pens/:penId",
  zValidator("param", adminPenIdParamSchema),
  zValidator("json", patchPenBodySchema),
  async (c) => {
    const { penId } = c.req.valid("param");
    const body = c.req.valid("json");
    const db = createDb(c.env.DB);
    const adminId = c.get("jwtUser").sub;
    const clientIp =
      c.req.header("CF-Connecting-IP") ??
      c.req.header("X-Forwarded-For")?.split(",")[0]?.trim() ??
      null;

    const data = await adminService.patchPen(db, adminId, clientIp, penId, body);

    return c.json({
      success: true,
      data,
      requestId: c.get("requestId"),
    });
  }
);

// ─── GET /api/admin/search-lookups ───────────────────────────────────────────

admin.get(
  "/search-lookups",
  zValidator("query", searchLookupQuerySchema),
  async (c) => {
    const query = c.req.valid("query");
    const db = createDb(c.env.DB);

    const data = await adminService.getSearchLookups(db, query);

    return c.json({
      success: true,
      data,
      requestId: c.get("requestId"),
    });
  }
);

export { admin as adminRoute };
