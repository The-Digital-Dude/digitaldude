import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/adminAuth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect all /admin routes except /admin/login
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const isValid = token ? await verifyAdminSessionToken(token) : false;

    if (!isValid) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If already logged in and visiting /admin/login, redirect to /admin dashboard
  if (pathname === "/admin/login") {
    const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const isValid = token ? await verifyAdminSessionToken(token) : false;

    if (isValid) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
