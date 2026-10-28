import { google } from "googleapis";
import { log } from "@/lib/logger";
import { SITE_URL } from "@/lib/utils";

export interface GscRow {
  key: string;
  clicks: number;
  impressions: number;
  position: number;
}

export interface GscTotals {
  clicks: number;
  impressions: number;
  position: number;
}

export interface Inspection {
  verdict: string;
  coverage: string;
  lastCrawl: string | null;
  inSitemap: boolean;
}

export interface SitemapInfo {
  lastDownloaded: string | null;
  lastSubmitted: string | null;
  errors: number;
  pending: boolean;
}

/** The slice of Search Console the blog autopilot uses. Tests replace it with a fake. */
export interface GscClient {
  query(dimension: "query" | "page", start: string, end: string, limit: number): Promise<GscRow[]>;
  totals(start: string, end: string): Promise<GscTotals>;
  inspect(url: string): Promise<Inspection>;
  sitemap(): Promise<SitemapInfo | null>;
  resubmitSitemap(): Promise<boolean>;
}

function credentials(): { email: string; key: string } | null {
  let raw = (process.env.GOOGLE_SERVICE_ACCOUNT_KEY ?? "").trim();
  if (!raw) return null;
  try {
    if (!raw.startsWith("{")) raw = Buffer.from(raw, "base64").toString("utf-8");
    const c = JSON.parse(raw) as { client_email?: string; private_key?: string };
    if (!c.client_email || !c.private_key) return null;
    return { email: c.client_email, key: c.private_key.includes("\\n") ? c.private_key.replace(/\\n/g, "\n") : c.private_key };
  } catch (e) {
    log("warn", { message: "blog autopilot: could not read GOOGLE_SERVICE_ACCOUNT_KEY", error: e });
    return null;
  }
}

/** A Search Console client for this site, or null when the service account is not configured. */
export function getGscClient(siteUrl = `${SITE_URL.replace(/\/$/, "")}/`): GscClient | null {
  const c = credentials();
  if (!c) return null;
  const auth = new google.auth.JWT({ email: c.email, key: c.key, scopes: ["https://www.googleapis.com/auth/webmasters"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const sitemapUrl = `${siteUrl}sitemap.xml`;

  return {
    async query(dimension, start, end, limit) {
      const r = await sc.searchanalytics.query({ siteUrl, requestBody: { startDate: start, endDate: end, dimensions: [dimension], rowLimit: limit } });
      return (r.data.rows ?? []).map((row) => ({ key: String(row.keys?.[0] ?? ""), clicks: row.clicks ?? 0, impressions: row.impressions ?? 0, position: row.position ?? 0 }));
    },
    async totals(start, end) {
      const r = await sc.searchanalytics.query({ siteUrl, requestBody: { startDate: start, endDate: end } });
      const row = r.data.rows?.[0];
      return { clicks: row?.clicks ?? 0, impressions: row?.impressions ?? 0, position: row?.position ?? 0 };
    },
    async inspect(url) {
      const r = await sc.urlInspection.index.inspect({ requestBody: { inspectionUrl: url, siteUrl } });
      const x = r.data.inspectionResult?.indexStatusResult;
      return { verdict: x?.verdict ?? "UNKNOWN", coverage: x?.coverageState ?? "unknown", lastCrawl: x?.lastCrawlTime ?? null, inSitemap: (x?.sitemap ?? []).length > 0 };
    },
    async sitemap() {
      try {
        const r = await sc.sitemaps.get({ siteUrl, feedpath: sitemapUrl });
        return { lastDownloaded: r.data.lastDownloaded ?? null, lastSubmitted: r.data.lastSubmitted ?? null, errors: Number(r.data.errors ?? 0), pending: r.data.isPending === true };
      } catch {
        return null;
      }
    },
    async resubmitSitemap() {
      try {
        await sc.sitemaps.submit({ siteUrl, feedpath: sitemapUrl });
        return true;
      } catch (e) {
        log("warn", { message: "blog autopilot: sitemap resubmit failed", error: e });
        return false;
      }
    },
  };
}

export const isoDay = (d: Date) => d.toISOString().slice(0, 10);
export const daysAgo = (now: Date, n: number) => new Date(now.getTime() - n * 86_400_000);
