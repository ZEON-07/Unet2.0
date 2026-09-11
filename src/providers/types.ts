/**
 * Search provider interface and shared result types.
 *
 * All concrete providers implement SearchProvider so the service layer
 * is completely decoupled from the underlying search API.
 */

/** A single search result returned by any provider. */
export type SearchResult = {
  /** Page title */
  title: string;
  /** Canonical URL of the source */
  url: string;
  /** Excerpt / snippet text that will be parsed for writing-length claims */
  content: string;
  /** Provider-specific relevance score (0–1), used for result ranking */
  score?: number;
};

/** Normalized response envelope from any provider. */
export type SearchResponse = {
  query: string;
  results: SearchResult[];
  /** Raw API response stored verbatim for auditing. */
  rawResponse: unknown;
};

/** Contract every search provider must fulfil. */
export interface SearchProvider {
  /** Unique human-readable name, logged and stored in audit records. */
  readonly name: string;
  /** Execute a web search and return normalized results. */
  search(query: string): Promise<SearchResponse>;
}
