/** Web search boundary used only for company discovery. Official API (Brave Search), AU results. */

export interface SearchResult {
  url: string;
  title: string;
  description: string;
}

export interface SearchProvider {
  readonly name: string;
  search(query: string, count: number, country?: string): Promise<SearchResult[]>;
}

export class SearchNotConfiguredError extends Error {
  constructor() {
    super("Search is not configured (BRAVE_SEARCH_API_KEY)");
    this.name = "SearchNotConfiguredError";
  }
}

export class BraveSearchProvider implements SearchProvider {
  readonly name = "brave";
  constructor(private readonly apiKey: string) {}

  async search(query: string, count: number, country = "AU"): Promise<SearchResult[]> {
    const u = new URL("https://api.search.brave.com/res/v1/web/search");
    u.searchParams.set("q", query);
    u.searchParams.set("count", String(Math.min(20, Math.max(1, count))));
    u.searchParams.set("country", country.toUpperCase());
    u.searchParams.set("search_lang", "en");
    const res = await fetch(u, { headers: { accept: "application/json", "x-subscription-token": this.apiKey }, signal: AbortSignal.timeout(15_000) });
    if (!res.ok) throw new Error(`Search API error ${res.status}`);
    const data = (await res.json()) as { web?: { results?: { url?: string; title?: string; description?: string }[] } };
    return (data.web?.results ?? [])
      .filter((r): r is { url: string; title?: string; description?: string } => typeof r.url === "string")
      .map((r) => ({ url: r.url, title: r.title ?? "", description: r.description ?? "" }));
  }
}

export function getSearchProvider(): SearchProvider | null {
  const key = process.env.BRAVE_SEARCH_API_KEY;
  return key ? new BraveSearchProvider(key) : null;
}
