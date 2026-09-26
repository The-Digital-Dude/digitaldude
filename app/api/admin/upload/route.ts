import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { log } from "@/lib/logger";

const BUCKET_NAME = "blog-images";

export async function POST(request: Request) {
  const isAuth = await isAdminAuthenticated(request);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      {
        ok: false,
        error: "Database/Storage not connected. Please configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
      },
      { status: 503 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ ok: false, error: "No image file provided" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { ok: false, error: "Only image files (PNG, JPG, WebP, GIF, SVG) are permitted." },
        { status: 400 }
      );
    }

    // Limit to 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { ok: false, error: "Image file size exceeds the 10MB limit." },
        { status: 400 }
      );
    }

    // Check if bucket exists, or create it if missing
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some((b) => b.name === BUCKET_NAME);
      if (!bucketExists) {
        const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
          public: true,
          fileSizeLimit: 10485760,
          allowedMimeTypes: [
            "image/png",
            "image/jpeg",
            "image/jpg",
            "image/webp",
            "image/gif",
            "image/svg+xml",
          ],
        });
        if (createError && !createError.message?.includes("already exists")) {
          log("warn", { message: "Could not auto-create storage bucket", error: createError });
        }
      }
    } catch {
      // Continue even if listBuckets fails due to policy; upload will succeed if bucket already created
    }

    // Generate safe filename: uploads/YYYY-MM/timestamp-slugname.ext
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const cleanBaseName = file.name
      .replace(/\.[^/.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .slice(0, 40);

    const now = new Date();
    const folder = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const uniqueFileName = `${Date.now()}-${cleanBaseName}.${ext}`;
    const storagePath = `${folder}/${uniqueFileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      log("error", { message: "Supabase storage upload error", error: uploadError });
      return NextResponse.json(
        {
          ok: false,
          error:
            uploadError.message ||
            "Failed to upload image to Supabase Storage. Ensure the 'blog-images' bucket is created and public.",
        },
        { status: 500 }
      );
    }

    const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(uploadData.path);

    log("info", { message: "Image uploaded successfully", context: { path: uploadData.path } });

    return NextResponse.json({
      ok: true,
      url: urlData.publicUrl,
      path: uploadData.path,
      name: file.name,
      size: file.size,
    });
  } catch (error) {
    log("error", { message: "Failed to upload image", error });
    return NextResponse.json(
      { ok: false, error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
