/**
 * Auth routes
 *
 * POST /api/auth/login  → verify credentials, return JWT
 */

import { Hono } from "hono";
import type { HonoEnv } from "../types/bindings";
import { createDb } from "../repositories/db";
import { zValidator } from "../utils/zValidator";
import { loginBodySchema } from "../validators/auth.validators";
import * as authService from "../services/auth.service";

const auth = new Hono<HonoEnv>();

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

auth.post(
  "/login",
  zValidator("json", loginBodySchema),
  async (c) => {
    const body = c.req.valid("json");
    const db = createDb(c.env.DB);

    const data = await authService.login(db, c.env, body);

    return c.json(
      {
        success: true,
        data,
        requestId: c.get("requestId"),
      },
      200
    );
  }
);

export { auth as authRoute };
