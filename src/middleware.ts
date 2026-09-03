import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { env } from "@/lib/env";

// Same secret source as src/lib/auth.ts — see env.ts for the production
// safety check that refuses to boot with the fallback value.
const JWT_SECRET = new TextEncoder().encode(env.JWT_SECRET);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Protect Admin Routes
  if (pathname.startsWith("/admin")) {
    // Exclude the login page itself
    if (pathname === "/admin/login") {
      const adminCookie = request.cookies.get("esnaf_admin_session")?.value;
      if (adminCookie) {
        try {
          const { payload } = await jwtVerify(adminCookie, JWT_SECRET);
          if (payload.role === "admin") {
            return NextResponse.redirect(new URL("/admin", request.url));
          }
        } catch {
          // Token is invalid, let user stay on login page
        }
      }
      return NextResponse.next();
    }

    // Check admin session for all other /admin pages
    const adminCookie = request.cookies.get("esnaf_admin_session")?.value;
    const authHeader = request.headers.get("authorization");
    const bearerToken = authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const token = adminCookie || bearerToken;

    if (!token) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      if (payload.role !== "admin") {
        const loginUrl = new URL("/admin/login", request.url);
        return NextResponse.redirect(loginUrl);
      }
    } catch (err) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
