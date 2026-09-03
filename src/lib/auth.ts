import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

// Single source of truth for these secrets is env.ts, which also refuses to
// boot in production if they were never set to real values.
const JWT_SECRET = new TextEncoder().encode(env.JWT_SECRET);
const ADMIN_PASSWORD = env.ADMIN_PASSWORD;

export interface MerchantSessionPayload {
  id: string;
  phone: string;
  slug: string;
  role: "merchant";
}

export interface AdminSessionPayload {
  role: "admin";
}

/**
 * Sign JWT token for Merchant
 */
export async function signMerchantToken(merchant: { id: string; phone: string; slug: string }): Promise<string> {
  return await new SignJWT({
    id: merchant.id,
    phone: merchant.phone,
    slug: merchant.slug,
    role: "merchant",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET);
}

/**
 * Verify JWT token for Merchant
 */
export async function verifyMerchantToken(token: string): Promise<MerchantSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.role === "merchant" && typeof payload.id === "string") {
      return payload as unknown as MerchantSessionPayload;
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Sign JWT token for Admin
 */
export async function signAdminToken(): Promise<string> {
  return await new SignJWT({
    role: "admin",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

/**
 * Verify Admin password
 */
export function checkAdminPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

/**
 * Verify JWT token for Admin
 */
export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.role === "admin";
  } catch (error) {
    return false;
  }
}

/**
 * Extract token from Request (Bearer or Cookie)
 */
export function extractTokenFromRequest(request: Request, cookieName: string): string | null {
  // 1. Authorization: Bearer <token>
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  // 2. Cookie: cookieName=<token>
  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) {
    const cookiesList = cookieHeader.split(";").map((c) => c.trim());
    const targetCookie = cookiesList.find((c) => c.startsWith(`${cookieName}=`));
    if (targetCookie) {
      return decodeURIComponent(targetCookie.substring(cookieName.length + 1));
    }
  }

  return null;
}

/**
 * Get merchant session from API Request
 */
export async function getMerchantSessionFromRequest(request: Request): Promise<MerchantSessionPayload | null> {
  const token = extractTokenFromRequest(request, "esnaf_session");
  if (!token) return null;
  return await verifyMerchantToken(token);
}

/**
 * Get admin session from API Request
 */
export async function getAdminSessionFromRequest(request: Request): Promise<boolean> {
  const token = extractTokenFromRequest(request, "esnaf_admin_session");
  if (!token) return false;
  const isValid = await verifyAdminToken(token);
  return Boolean(isValid);
}

/**
 * Get merchant session from Next.js Server Action / Server Component
 */
export async function getMerchantSession(): Promise<MerchantSessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("esnaf_session")?.value;
    if (!token) return null;
    return await verifyMerchantToken(token);
  } catch {
    return null;
  }
}

/**
 * Get admin session from Next.js Server Action / Server Component
 */
export async function getAdminSession(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("esnaf_admin_session")?.value;
    if (!token) return false;
    const isValid = await verifyAdminToken(token);
    return Boolean(isValid);
  } catch {
    return false;
  }
}
