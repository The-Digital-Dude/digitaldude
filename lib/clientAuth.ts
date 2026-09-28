import crypto from "crypto";
import { getSupabaseServerClient } from "@/lib/supabaseClient";

const CLIENT_SECRET =
  process.env.CLIENT_AUTH_SECRET ||
  process.env.ADMIN_PASSWORD ||
  "digitaldude_client_portal_secret_2026";
const COOKIE_NAME = "tdd_client_session";

export interface ClientSessionPayload {
  id: string; // project_id
  client_name: string;
  client_email: string;
  company_name: string | null;
  project_title: string;
}

export function signClientToken(projectId: string, email: string): string {
  const expiresAt = Date.now() + 60 * 24 * 60 * 60 * 1000; // 60 days
  const data = `${projectId}:${email}:${expiresAt}`;
  const signature = crypto.createHmac("sha256", CLIENT_SECRET).update(data).digest("hex");
  return `${Buffer.from(data).toString("base64url")}.${signature}`;
}

export function verifyClientToken(token: string): { projectId: string; email: string } | null {
  try {
    const [dataB64, signature] = token.split(".");
    if (!dataB64 || !signature) return null;

    const data = Buffer.from(dataB64, "base64url").toString("utf-8");
    const expectedSig = crypto.createHmac("sha256", CLIENT_SECRET).update(data).digest("hex");

    if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      const [projectId, email, expiresStr] = data.split(":");
      if (Number(expiresStr) < Date.now()) return null;
      return { projectId, email };
    }
    return null;
  } catch {
    return null;
  }
}

export async function getAuthenticatedClient(request: Request): Promise<ClientSessionPayload | null> {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match) return null;

  const verified = verifyClientToken(match[1]);
  if (!verified) return null;

  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const { data: project, error } = await supabase
    .from("client_projects")
    .select("id, client_name, client_email, company_name, project_title")
    .eq("id", verified.projectId)
    .single();

  if (error || !project) {
    return null;
  }

  return project as ClientSessionPayload;
}
