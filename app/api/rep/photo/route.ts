import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { getOnboardedRep } from "@/lib/repAuth";
import { rateLimit } from "@/lib/rateLimit";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

const BUCKET = "rep-photos";
const MAX_BYTES = 2 * 1024 * 1024;

/** The real type of the file, from its first bytes: a renamed script or HTML file is never accepted as an image. */
export function sniffImage(b: Uint8Array): { ext: "jpg" | "png" | "webp"; mime: string } | null {
  if (b.length > 12 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: "jpg", mime: "image/jpeg" };
  if (b.length > 12 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { ext: "png", mime: "image/png" };
  if (b.length > 12 && String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP") return { ext: "webp", mime: "image/webp" };
  return null;
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin) return true;
  try {
    return !!host && new URL(origin).host === host;
  } catch {
    return false;
  }
}

const pathFromUrl = (url: string | null | undefined) => {
  const m = (url ?? "").match(new RegExp(`/storage/v1/object/public/${BUCKET}/(.+)$`));
  return m ? decodeURIComponent(m[1]) : null;
};

/** The rep uploads their own signature photo (JPEG, PNG or WebP, up to 2 MB). Only ever changes their own row. */
export async function POST(request: Request) {
  const rep = await getOnboardedRep(request);
  if (!rep) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!sameOrigin(request)) return NextResponse.json({ ok: false, error: "Cross-origin request rejected" }, { status: 403 });
  if (!rateLimit(`rep_photo:${rep.id}`, 10, 60 * 60 * 1000).ok) return NextResponse.json({ ok: false, error: "Too many uploads. Please wait." }, { status: 429 });
  const db = getSupabaseServerClient();
  if (!db) return NextResponse.json({ ok: false, error: "Storage not connected" }, { status: 503 });

  try {
    const file = (await request.formData()).get("file");
    if (!(file instanceof File)) return NextResponse.json({ ok: false, error: "Choose an image first." }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ ok: false, error: "That image is over 2 MB. Please choose a smaller one." }, { status: 413 });
    const bytes = new Uint8Array(await file.arrayBuffer());
    const kind = sniffImage(bytes);
    if (!kind) return NextResponse.json({ ok: false, error: "Only JPEG, PNG or WebP photos are accepted." }, { status: 415 });

    const path = `${rep.id}/${randomUUID()}.${kind.ext}`;
    const up = await db.storage.from(BUCKET).upload(path, bytes, { contentType: kind.mime, upsert: false, cacheControl: "31536000" });
    if (up.error) throw new Error(up.error.message);
    const { data: urlData } = db.storage.from(BUCKET).getPublicUrl(path);

    const { data: before } = await db.from("employees").select("photo_url").eq("id", rep.id).maybeSingle();
    const upd = await db.from("employees").update({ photo_url: urlData.publicUrl }).eq("id", rep.id);
    if (upd.error) throw new Error(upd.error.message);
    const old = pathFromUrl(before?.photo_url as string | null);
    if (old && old.startsWith(`${rep.id}/`)) await db.storage.from(BUCKET).remove([old]);
    return NextResponse.json({ ok: true, photoUrl: urlData.publicUrl });
  } catch (e) {
    log("error", { message: "rep photo upload failed", error: e });
    return NextResponse.json({ ok: false, error: "Could not save the photo. Please try again." }, { status: 500 });
  }
}

/** Removes the rep's photo (the signature falls back to initials). */
export async function DELETE(request: Request) {
  const rep = await getOnboardedRep(request);
  if (!rep) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!sameOrigin(request)) return NextResponse.json({ ok: false, error: "Cross-origin request rejected" }, { status: 403 });
  const db = getSupabaseServerClient();
  if (!db) return NextResponse.json({ ok: false, error: "Storage not connected" }, { status: 503 });
  const { data } = await db.from("employees").select("photo_url").eq("id", rep.id).maybeSingle();
  const old = pathFromUrl(data?.photo_url as string | null);
  await db.from("employees").update({ photo_url: null }).eq("id", rep.id);
  if (old && old.startsWith(`${rep.id}/`)) await db.storage.from(BUCKET).remove([old]);
  return NextResponse.json({ ok: true });
}
