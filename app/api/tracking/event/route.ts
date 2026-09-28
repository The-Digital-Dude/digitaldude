import { NextResponse } from "next/server";
import { sendMetaCapiEvent } from "@/lib/metaCapi";
import { getClientIp } from "@/lib/rateLimit";
import { log } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const userAgent = request.headers.get("user-agent") || undefined;
    const cookieHeader = request.headers.get("cookie") || "";
    
    const fbpMatch = cookieHeader.match(/_fbp=([^;]+)/);
    const fbcMatch = cookieHeader.match(/_fbc=([^;]+)/);

    const body = await request.json().catch(() => ({}));
    const {
      eventName = "PageView",
      eventId,
      eventSourceUrl,
      customData = {},
      user = {},
    } = body;

    const capiResult = await sendMetaCapiEvent({
      eventName,
      eventId,
      eventSourceUrl: eventSourceUrl || "https://www.digitaldude.co.uk",
      user: {
        email: user.email || null,
        phone: user.phone || null,
        firstName: user.firstName || null,
        lastName: user.lastName || null,
        clientIpAddress: ip,
        clientUserAgent: userAgent,
        fbp: user.fbp || (fbpMatch ? fbpMatch[1] : undefined),
        fbc: user.fbc || (fbcMatch ? fbcMatch[1] : undefined),
      },
      customData,
    });

    return NextResponse.json({ ok: true, capi: capiResult });
  } catch (error) {
    log("warn", { message: "Server-side tracking endpoint exception", error });
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
