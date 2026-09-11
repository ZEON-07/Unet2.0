/**
 * Tavily Search provider.
 *
 * Tavily is a search API designed for LLM / AI applications.
 * Docs: https://docs.tavily.com/docs/tavily-api/rest_api
 *
 * API key must be set via wrangler secret (TAVILY_API_KEY).
 * Never put the key in code or wrangler.toml.
 */

import type { SearchProvider, SearchResponse, SearchResult } from "./types";

/** Tavily /search endpoint */
const TAVILY_ENDPOINT = "https://api.tavily.com/search";

/** Shape of a Tavily search result object */
type TavilyResult = {
  title: string;
  url: string;
  content: string;
  score: number;
  raw_content?: string | null;
};

/** Shape of the Tavily /search response */
type TavilyResponse = {
  query: string;
  results: TavilyResult[];
  answer?: string | null;
};

export class TavilyProvider implements SearchProvider {
  readonly name = "tavily";

  constructor(private readonly apiKey: string) {}

  async search(query: string): Promise<SearchResponse> {
    const body = {
      api_key: this.apiKey,
      query,
      search_depth: "advanced",
      max_results: 8,
      include_raw_content: false,
      include_images: false,
      // Bias towards manufacturer pages and technical specs
      include_domains: [],
      exclude_domains: [],
    };

    const res = await fetch(TAVILY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Tavily API error ${res.status}: ${text.slice(0, 200)}`);
    }

    const data = (await res.json()) as TavilyResponse;

    const results: SearchResult[] = (data.results ?? []).map((r) => ({
      title: r.title,
      url: r.url,
      content: r.content,
      score: r.score,
    }));

    return {
      query,
      results,
      rawResponse: data,
    };
  }
}
