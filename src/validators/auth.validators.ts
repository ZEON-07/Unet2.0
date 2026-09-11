/**
 * Auth request validators.
 */

import { z } from "zod";

/** POST /api/auth/login */
export const loginBodySchema = z.object({
  email: z.string().email("Must be a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginBody = z.infer<typeof loginBodySchema>;
