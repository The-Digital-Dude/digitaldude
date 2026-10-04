import { google } from "googleapis";
import { log } from "@/lib/logger";
import { SITE_URL } from "@/lib/utils";

const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/indexing",
  "https://www.googleapis.com/auth/webmasters.readonly",
];

/**
 * Returns an authenticated Google client using existing OAuth refresh token
 * or Service Account key from .env.local.
 */
export async function getGoogleSeoAuthClient() {
  // 1. Try Service Account Key (JSON or individual vars)
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountJson) {
    try {
      const creds = JSON.parse(serviceAccountJson);
      const auth = new google.auth.JWT({
        email: creds.client_email,
        key: creds.private_key,
        scopes: GOOGLE_SCOPES,
      });
      return auth;
    } catch (e) {
      log("warn", { message: "[Google SEO] Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY json, trying OAuth fallback" });
    }
  }

  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  if (clientEmail && privateKey) {
    const formattedKey = privateKey.includes("\\n")
      ? privateKey.replace(/\\n/g, "\n")
      : privateKey;
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: formattedKey,
      scopes: GOOGLE_SCOPES,
    });
    return auth;
  }

  // 2. Try existing OAuth client (Client ID, Client Secret, Refresh Token)
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;

  if (clientId && clientSecret && refreshToken) {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    return oauth2Client;
  }

  return null;
}

export interface GoogleIndexResult {
  ok: boolean;
  submitted: number;
  failed: number;
  quotaRemaining?: number;
  details?: Array<{ url: string; status: "success" | "error"; error?: string }>;
  error?: string;
}

// In-memory / daily tracker for 200 quota limit
let dailyQuotaCount = 0;
let lastResetDay = new Date().toISOString().split("T")[0];

function checkDailyQuota(): number {
  const today = new Date().toISOString().split("T")[0];
  if (today !== lastResetDay) {
    dailyQuotaCount = 0;
    lastResetDay = today;
  }
  return dailyQuotaCount;
}

export function getGoogleQuotaStatus() {
  const used = checkDailyQuota();
  return {
    limit: 200,
    used,
    remaining: Math.max(0, 200 - used),
    resetDate: lastResetDay,
    hasAuth: Boolean(
      process.env.GOOGLE_SERVICE_ACCOUNT_KEY ||
      (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) ||
      (process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_REFRESH_TOKEN)
    ),
  };
}

/**
 * Submits single or batch URLs to Google Web Search Indexing API (URL_UPDATED).
 */
export async function submitToGoogleIndexing(
  urls: string[],
  type: "URL_UPDATED" | "URL_DELETED" = "URL_UPDATED"
): Promise<GoogleIndexResult> {
  const auth = await getGoogleSeoAuthClient();
  if (!auth) {
    return {
      ok: false,
      submitted: 0,
      failed: urls.length,
      error:
        "Google Authentication not configured. Please ensure Google OAuth or GOOGLE_SERVICE_ACCOUNT_KEY is set in environment.",
    };
  }

  const indexing = google.indexing({ version: "v3", auth });
  const details: Array<{ url: string; status: "success" | "error"; error?: string }> = [];
  let submittedCount = 0;
  let failedCount = 0;

  for (const rawUrl of urls) {
    const fullUrl = rawUrl.startsWith("http")
      ? rawUrl
      : `${SITE_URL}${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`;

    try {
      await indexing.urlNotifications.publish({
        requestBody: {
          url: fullUrl,
          type: type,
        },
      });

      submittedCount++;
      dailyQuotaCount++;
      details.push({ url: fullUrl, status: "success" });
    } catch (err: any) {
      failedCount++;
      const errorMessage =
        err?.response?.data?.error?.message || err?.message || "Failed to publish URL notification";
      details.push({ url: fullUrl, status: "error", error: errorMessage });
      log("error", { message: `[Google Indexing API] Error indexing ${fullUrl}: ${errorMessage}` });
    }
  }

  return {
    ok: submittedCount > 0 || urls.length === 0,
    submitted: submittedCount,
    failed: failedCount,
    quotaRemaining: Math.max(0, 200 - dailyQuotaCount),
    details,
  };
}

/**
 * Inspect a URL via Google Search Console URL Inspection API.
 */
export async function inspectGoogleUrl(inspectionUrl: string) {
  const auth = await getGoogleSeoAuthClient();
  if (!auth) {
    return {
      ok: false,
      error: "Google credentials not configured.",
    };
  }

  const searchconsole = google.searchconsole({ version: "v1", auth });
  const fullUrl = inspectionUrl.startsWith("http")
    ? inspectionUrl
    : `${SITE_URL}${inspectionUrl.startsWith("/") ? "" : "/"}${inspectionUrl}`;

  try {
    const siteUrl = SITE_URL.endsWith("/") ? SITE_URL : `${SITE_URL}/`;
    const res = await searchconsole.urlInspection.index.inspect({
      requestBody: {
        inspectionUrl: fullUrl,
        siteUrl: siteUrl,
      },
    });

    return {
      ok: true,
      url: fullUrl,
      inspectionResult: res.data.inspectionResult,
    };
  } catch (err: any) {
    return {
      ok: false,
      url: fullUrl,
      error: err?.response?.data?.error?.message || err?.message || "Inspection failed",
    };
  }
}

/**
 * Fetch Search Console performance analytics (clicks, impressions, ctr, position).
 */
export async function getGoogleSearchAnalytics(startDate?: string, endDate?: string) {
  const auth = await getGoogleSeoAuthClient();
  if (!auth) {
    return {
      ok: false,
      error: "Google credentials not configured.",
    };
  }

  const searchconsole = google.searchconsole({ version: "v1", auth });
  const siteUrl = SITE_URL.endsWith("/") ? SITE_URL : `${SITE_URL}/`;

  const now = new Date();
  const defaultEnd = now.toISOString().split("T")[0];
  const prior = new Date(now.setDate(now.getDate() - 28));
  const defaultStart = prior.toISOString().split("T")[0];

  try {
    const res = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: startDate || defaultStart,
        endDate: endDate || defaultEnd,
        dimensions: ["page"],
        rowLimit: 100,
      },
    });

    return {
      ok: true,
      rows: res.data.rows || [],
    };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.response?.data?.error?.message || err?.message || "Failed to load Search Console analytics",
    };
  }
}
