/** Contact-finder boundary (Hunter.io). Results are suggestions only: nothing here may be emailed. */

export interface FoundEmail {
  email: string;
  firstName: string | null;
  lastName: string | null;
  position: string | null;
  /** 0-100, the provider's own confidence that the address is valid. */
  confidence: number | null;
  sourceUris: string[];
}

export interface DomainSearchResult {
  organization: string | null;
  emails: FoundEmail[];
}

export interface AccountInfo {
  plan: string;
  searchesUsed: number | null;
  searchesAvailable: number | null;
}

export class ContactFinderHttpError extends Error {
  constructor(readonly status: number, readonly detail: string) {
    super(`Contact finder returned HTTP ${status}${detail ? `: ${detail}` : ""}`);
    this.name = "ContactFinderHttpError";
  }
}

export interface ContactFinder {
  readonly name: string;
  domainSearch(domain: string, limit: number): Promise<DomainSearchResult>;
  account(): Promise<AccountInfo>;
}

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

/** Hunter.io v2. The key is sent in the X-API-KEY header (never in the URL, so it can't leak into logs). */
export class HunterProvider implements ContactFinder {
  readonly name = "hunter";
  constructor(private readonly apiKey: string) {}

  private async get(path: string, params: Record<string, string> = {}) {
    const u = new URL(`https://api.hunter.io/v2/${path}`);
    for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
    const res = await fetch(u, { headers: { accept: "application/json", "x-api-key": this.apiKey }, signal: AbortSignal.timeout(20_000) });
    const body = (await res.json().catch(() => null)) as { data?: Record<string, unknown>; errors?: { details?: string; id?: string }[] } | null;
    if (!res.ok) throw new ContactFinderHttpError(res.status, String(body?.errors?.[0]?.details ?? body?.errors?.[0]?.id ?? "").slice(0, 200));
    return body?.data ?? {};
  }

  async domainSearch(domain: string, limit: number): Promise<DomainSearchResult> {
    const data = await this.get("domain-search", { domain, limit: String(Math.min(Math.max(1, limit), 10)) });
    const emails = ((data.emails as Record<string, unknown>[] | undefined) ?? [])
      .map((e): FoundEmail | null => {
        const email = str(e.value);
        if (!email) return null;
        const sources = ((e.sources as { uri?: unknown }[] | undefined) ?? []).map((s) => str(s.uri)).filter((x): x is string => !!x);
        return { email: email.toLowerCase(), firstName: str(e.first_name), lastName: str(e.last_name), position: str(e.position), confidence: num(e.confidence), sourceUris: sources };
      })
      .filter((e): e is FoundEmail => e !== null);
    return { organization: str(data.organization), emails };
  }

  async account(): Promise<AccountInfo> {
    const d = (await this.get("account")) as { plan_name?: unknown; requests?: { searches?: { used?: unknown; available?: unknown } } };
    return { plan: str(d.plan_name) ?? "unknown", searchesUsed: num(d.requests?.searches?.used), searchesAvailable: num(d.requests?.searches?.available) };
  }
}
