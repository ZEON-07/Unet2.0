/**
 * Stub / fallback search provider.
 *
 * Used when:
 *  - No TAVILY_API_KEY is configured (local dev without a key)
 *  - Any real provider throws an unrecoverable error
 *
 * Always returns an empty result set so the pipeline can still create a
 * SearchLookup record and return a well-formed response.
 */

import type { SearchProvider, SearchResponse } from "./types";

export class StubProvider implements SearchProvider {
  readonly name = "stub";

  async search(query: string): Promise<SearchResponse> {
    console.warn(
      `[StubProvider] No real search provider configured. Returning empty results for: "${query}"`
    );
    return {
      query,
      results: [],
      rawResponse: { provider: "stub", note: "No API key configured" },
    };
  }
}
