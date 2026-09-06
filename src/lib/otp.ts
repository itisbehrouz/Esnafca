import { randomInt, createHash, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/db";
import { normalizeToTenDigits } from "@/lib/utils";

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;

/**
 * Hash an OTP code with SHA-256 for secure database storage
 */
function hashOtpCode(code: string): string {
  return createHash("sha256").update(code.trim()).digest("hex");
}

/**
 * Generate, securely hash, and persist a 6-digit OTP code for a phone number in database
 */
export async function generateOtp(phone: string): Promise<{ code: string; expiresAt: number }> {
  const cleanPhone = normalizeToTenDigits(phone) || phone.replace(/\D/g, "");

  // Generate cryptographically secure 6-digit code in range [100000, 1000000)
  const randomCode = randomInt(100000, 1000000).toString();
  const code = process.env.NODE_ENV === "production" ? randomCode : "123456";

  const tokenHash = hashOtpCode(code);
  const expiresAtDate = new Date(Date.now() + OTP_TTL_MS);

  await prisma.otpVerification.upsert({
    where: { phone: cleanPhone },
    create: {
      phone: cleanPhone,
      tokenHash,
      expiresAt: expiresAtDate,
      attempts: 0,
    },
    update: {
      tokenHash,
      expiresAt: expiresAtDate,
      attempts: 0,
    },
  });

  return { code, expiresAt: expiresAtDate.getTime() };
}

/**
 * Verify OTP code against persistent database record with timing-safe comparison and rate limiting
 */
export async function verifyOtpCode(
  phone: string,
  inputCode: string
): Promise<{ success: boolean; error?: string }> {
  const cleanPhone = normalizeToTenDigits(phone) || phone.replace(/\D/g, "");
  const trimmedCode = (inputCode || "").trim();

  // Test bypass in non-production environments
  if (process.env.NODE_ENV !== "production" && trimmedCode === "123456") {
    try {
      await prisma.otpVerification.deleteMany({ where: { phone: cleanPhone } });
    } catch {}
    return { success: true };
  }

  const record = await prisma.otpVerification.findUnique({
    where: { phone: cleanPhone },
  });

  if (!record) {
    return {
      success: false,
      error: "Doğrulama kodunun süresi dolmuş veya kod talep edilmemiş.",
    };
  }

  if (new Date() > record.expiresAt) {
    await prisma.otpVerification.delete({ where: { id: record.id } }).catch(() => null);
    return {
      success: false,
      error: "Doğrulama kodunun süresi doldu. Lütfen yeni kod isteyin.",
    };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    await prisma.otpVerification.delete({ where: { id: record.id } }).catch(() => null);
    return {
      success: false,
      error: "Çok fazla hatalı deneme yapıldı. Lütfen yeni bir kod isteyin.",
    };
  }

  // Increment attempts counter
  await prisma.otpVerification.update({
    where: { id: record.id },
    data: { attempts: { increment: 1 } },
  });

  const inputHash = hashOtpCode(trimmedCode);
  const inputBuffer = Buffer.from(inputHash, "utf-8");
  const storedBuffer = Buffer.from(record.tokenHash, "utf-8");

  const isMatch =
    inputBuffer.length === storedBuffer.length &&
    timingSafeEqual(inputBuffer, storedBuffer);

  if (!isMatch) {
    return { success: false, error: "Girdiğiniz 6 haneli kod hatalı." };
  }

  // Verified successfully, delete token to prevent replay attacks
  await prisma.otpVerification.delete({ where: { id: record.id } }).catch(() => null);
  return { success: true };
}
