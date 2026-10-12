import { NextResponse } from "next/server";
import type { ZodType, z } from "zod";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { log } from "@/lib/logger";

export function jsonError(message: string, status: number, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

/**
 * Server-side authorization for every admin endpoint. Mutations must also be
 * same-origin JSON, which blocks cross-site form posts riding the admin cookie.
 * Returns a response to send if the request must be rejected, otherwise null.
 */
export async function guardAdmin(request: Request): Promise<NextResponse | null> {
  if (!(await isAdminAuthenticated(request))) return jsonError("Unauthorized", 401);
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    if (origin) {
      let originHost = "";
      try {
        originHost = new URL(origin).host;
      } catch {
        /* falls through to rejection */
      }
      if (!host || originHost !== host) return jsonError("Cross-origin request rejected", 403);
    }
    if (!(request.headers.get("content-type") ?? "").toLowerCase().includes("application/json")) {
      return jsonError("Content-Type must be application/json", 415);
    }
  }
  return null;
}

export async function parseBody<S extends ZodType>(request: Request, schema: S): Promise<{ data: z.infer<S> } | { error: NextResponse }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { error: jsonError("Invalid JSON body", 400) };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { error: jsonError("Validation failed", 422, { issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) }) };
  }
  return { data: parsed.data };
}

/** Our own database-raised rule violations are safe and useful to show; anything else is not. */
const RULE_VIOLATION =
  /(content_changed|ineligible_recipient|no reviewed consent|cannot be eligible|not eligible|frozen|illegal campaign transition|changed since approval|no drafts|approver required|must be pending_approval|draft campaign|is suppressed|append-only|does not match)/i;

export function errorResponse(e: unknown, what: string) {
  const message = e instanceof Error ? e.message : String(e);
  if (RULE_VIOLATION.test(message)) return jsonError(message.replace(/^[^:]+: /, ""), 409);
  log("error", { message: `acquisition: ${what} failed`, error: e });
  return jsonError("Something went wrong. Check the server logs.", 500);
}
