/**
 * Provider factory.
 *
 * Returns the appropriate SearchProvider based on the environment:
 *  - TAVILY_API_KEY set  →  TavilyProvider (primary)
 *  - Key absent/empty   →  StubProvider (safe fallback / local dev)
 */

import type { SearchProvider } from "./types";
import { TavilyProvider } from "./tavily.provider";
import { StubProvider } from "./stub.provider";

/**
 * Create and return the best available search provider.
 * @param tavilyApiKey - Value of the TAVILY_API_KEY binding (may be empty string)
 */
export function createProvider(tavilyApiKey: string | undefined): SearchProvider {
  if (tavilyApiKey && tavilyApiKey.trim().length > 0) {
    return new TavilyProvider(tavilyApiKey.trim());
  }
  return new StubProvider();
}

export type { SearchProvider, SearchResponse, SearchResult } from "./types";
