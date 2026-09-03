import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { env } from "@/lib/env";

const JWT_SECRET = new TextEncoder().encode(env.JWT_SECRET);

/**
 * Check if the path is a public static asset or an exempted route
 */
function isExemptedPath(pathname: string): boolean {
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/uploads") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/api/payments/webhook" ||
    pathname === "/preview-gate"
  ) {
    return true;
  }

  // Common static file extensions
  if (
    /\.(png|svg|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot|css|js|map|txt|xml|json)$/i.test(
      pathname
    )
  ) {
    return true;
  }

  return false;
}

/**
 * Sanitize redirect parameter to prevent open redirect vulnerabilities.
 * Ensures the target begins with a single '/' and not '//', and rejects external URLs.
 */
function sanitizeRedirect(target: string | null, fallback = "/"): string {
  if (!target || typeof target !== "string") {
    return fallback;
  }

  const trimmed = target.trim();

  // Must begin with a single slash, not double slash or backslash
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.includes("\\") ||
    trimmed.includes("://")
  ) {
    return fallback;
  }

  // Prevent redirect loops back to preview-gate
  if (trimmed === "/preview-gate" || trimmed.startsWith("/preview-gate?")) {
    return fallback;
  }

  return trimmed;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sitePassword = process.env.SITE_PASSWORD || env.SITE_PASSWORD;
  const siteCookieName = process.env.SITE_ACCESS_COOKIE || env.SITE_ACCESS_COOKIE || "esnaf_preview_session";

  // 1. If user is accessing the preview gate page, check if already authenticated
  if (pathname === "/preview-gate") {
    if (!sitePassword) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const previewCookie = request.cookies.get(siteCookieName)?.value;
    if (previewCookie) {
      try {
        const { payload } = await jwtVerify(previewCookie, JWT_SECRET);
        if (payload.role === "preview_tester") {
          const rawRedirect = request.nextUrl.searchParams.get("redirect");
          const redirectTo = sanitizeRedirect(rawRedirect, "/");
          return NextResponse.redirect(new URL(redirectTo, request.url));
        }
      } catch {
        // Invalid token, allow access to preview-gate
      }
    }
    return NextResponse.next();
  }

  // 2. Skip checks for static assets and exempted endpoints
  if (isExemptedPath(pathname)) {
    return NextResponse.next();
  }

  // 3. Site-Wide Private Preview Gatekeeper
  if (sitePassword) {
    const previewCookie = request.cookies.get(siteCookieName)?.value;
    let isPreviewAuthorized = false;

    if (previewCookie) {
      try {
        const { payload } = await jwtVerify(previewCookie, JWT_SECRET);
        if (payload.role === "preview_tester") {
          isPreviewAuthorized = true;
        }
      } catch {
        isPreviewAuthorized = false;
      }
    }

    if (!isPreviewAuthorized) {
      const gateUrl = new URL("/preview-gate", request.url);
      const fullPath = pathname + request.nextUrl.search;
      const safeRedirect = sanitizeRedirect(fullPath, "/");
      if (safeRedirect !== "/") {
        gateUrl.searchParams.set("redirect", safeRedirect);
      }
      return NextResponse.redirect(gateUrl);
    }
  }

  // 4. Protect Admin Routes
  if (pathname.startsWith("/admin")) {
    // Exclude the admin login page itself
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
    const bearerToken =
      authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const token = adminCookie || bearerToken;

    if (!token) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", sanitizeRedirect(pathname, "/admin"));
      return NextResponse.redirect(loginUrl);
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      if (payload.role !== "admin") {
        const loginUrl = new URL("/admin/login", request.url);
        return NextResponse.redirect(loginUrl);
      }
    } catch {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", sanitizeRedirect(pathname, "/admin"));
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
