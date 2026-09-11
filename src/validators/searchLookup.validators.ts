/**
 * Search lookup request validators.
 */

import { z } from "zod";

/**
 * POST /api/search-lookups
 *
 * Accepts either:
 *  (a) { brand, model }        → builds the canonical query automatically
 *  (b) { query }               → uses the free-text query as-is
 *  (c) { brand, model, query } → query overrides the auto-built one
 */
export const searchLookupBodySchema = z
  .object({
    brand: z.string().min(1).max(100).optional(),
    model: z.string().min(1).max(100).optional(),
    query: z.string().min(3).max(300).optional(),
  })
  .refine(
    (d) => d.brand !== undefined || d.model !== undefined || d.query !== undefined,
    { message: "Provide at least brand+model or a free-text query" }
  );

export type SearchLookupBody = z.infer<typeof searchLookupBodySchema>;
