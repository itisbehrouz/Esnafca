"use server";

import { timingSafeEqual, createHash } from "crypto";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

const JWT_SECRET = new TextEncoder().encode(env.JWT_SECRET);

/**
 * Timing-safe string comparison via SHA-256 digests.
 * Prevents length and timing side-channel attacks.
 */
function isPasswordValid(submitted: string, expected: string): boolean {
  if (!submitted || !expected) return false;
  const hashSubmitted = createHash("sha256").update(submitted).digest();
  const hashExpected = createHash("sha256").update(expected).digest();
  return timingSafeEqual(hashSubmitted, hashExpected);
}

/**
 * Sign 30-day preview tester JWT token.
 */
export async function signPreviewToken(): Promise<string> {
  return await new SignJWT({ role: "preview_tester" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET);
}

export interface PreviewAuthResult {
  success: boolean;
  error?: string;
  redirectUrl?: string;
}

/**
 * Verify submitted site password and issue preview access cookie.
 */
export async function verifySitePasswordAction(
  password: string,
  redirectPath?: string
): Promise<PreviewAuthResult> {
  const expectedPassword = (process.env.SITE_PASSWORD || env.SITE_PASSWORD || "").trim();
  const siteCookieName = process.env.SITE_ACCESS_COOKIE || env.SITE_ACCESS_COOKIE || "esnaf_preview_session";

  // If SITE_PASSWORD is not configured, preview gate is open
  if (!expectedPassword) {
    return { success: true, redirectUrl: redirectPath || "/" };
  }

  const cleanInput = (password || "").trim();
  const isValid = isPasswordValid(cleanInput, expectedPassword);

  if (!isValid) {
    // Artificial 300ms delay to thwart automated brute-force attempts
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { success: false, error: "Geçersiz erişim şifresi." };
  }

  const token = await signPreviewToken();

  try {
    const cookieStore = await cookies();
    cookieStore.set({
      name: siteCookieName,
      value: token,
      httpOnly: true,
      secure: env.IS_PROD,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });
  } catch {
    // In standalone CLI test runners, request store may not be present
  }

  // Sanitize redirect path to prevent open-redirect vulnerabilities
  let targetUrl = redirectPath || "/";
  if (
    !targetUrl.startsWith("/") ||
    targetUrl.startsWith("//") ||
    targetUrl.startsWith("/preview-gate")
  ) {
    targetUrl = "/";
  }

  return {
    success: true,
    redirectUrl: targetUrl,
  };
}

/**
 * Clear preview session cookie.
 */
export async function logoutPreviewAction(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(env.SITE_ACCESS_COOKIE);
  } catch {
    // Ignore outside request store
  }
}
