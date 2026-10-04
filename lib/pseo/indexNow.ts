import { SITE_URL } from "@/lib/utils";

export const INDEXNOW_KEY = process.env.INDEXNOW_KEY || "1cd5f8140c4a4863a9eb25087fd2ddcb";

export interface IndexNowSubmitResult {
  ok: boolean;
  count: number;
  statusCode?: number;
  message?: string;
  error?: string;
}

/**
 * Submit URLs to the IndexNow protocol (Bing, Yahoo, Naver, Copilot, etc.)
 */
export async function submitToIndexNow(urls: string[]): Promise<IndexNowSubmitResult> {
  if (!urls || urls.length === 0) {
    return { ok: false, count: 0, error: "No URLs provided" };
  }

  // Ensure absolute URLs
  const absoluteUrls = urls.map((u) => {
    if (u.startsWith("http://") || u.startsWith("https://")) return u;
    const cleanPath = u.startsWith("/") ? u : `/${u}`;
    return `${SITE_URL}${cleanPath}`;
  });

  const parsedHost = new URL(SITE_URL).hostname;

  const payload = {
    host: parsedHost,
    key: INDEXNOW_KEY,
    keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
    urlList: absoluteUrls.slice(0, 10000), // IndexNow batch max
  };

  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(payload),
    });

    if (res.status === 200 || res.status === 202) {
      return {
        ok: true,
        count: absoluteUrls.length,
        statusCode: res.status,
        message: `Successfully submitted ${absoluteUrls.length} URLs to IndexNow search engine cluster.`,
      };
    }

    const text = await res.text();
    return {
      ok: false,
      count: 0,
      statusCode: res.status,
      error: `IndexNow returned HTTP ${res.status}: ${text || res.statusText}`,
    };
  } catch (err: any) {
    return {
      ok: false,
      count: 0,
      error: err.message || "Failed to reach IndexNow API endpoint.",
    };
  }
}
