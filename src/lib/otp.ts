/**
 * In-Memory OTP Store with Expiration and Rate Limiting
 */

interface OtpEntry {
  code: string;
  phone: string;
  expiresAt: number;
  attempts: number;
}

// Map of phone -> OtpEntry
const otpStore = new Map<string, OtpEntry>();

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;

// Clean up expired entries periodically
const interval = setInterval(() => {
  const now = Date.now();
  for (const [phone, entry] of otpStore.entries()) {
    if (entry.expiresAt < now) {
      otpStore.delete(phone);
    }
  }
}, 60 * 1000);

if (typeof interval.unref === "function") {
  interval.unref();
}

/**
 * Generate and save a 6-digit OTP code for a phone number
 */
export function generateOtp(phone: string): { code: string; expiresAt: number } {
  const cleanPhone = phone.replace(/\D/g, "");
  
  // Outside production, always issue the fixed test code so manual and
  // automated testing doesn't need a real SMS provider. Production always
  // gets a random code — see verifyOtpCode for the matching check.
  const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
  const code = process.env.NODE_ENV === "production" ? randomCode : "123456";
  const expiresAt = Date.now() + OTP_TTL_MS;

  otpStore.set(cleanPhone, {
    code,
    phone: cleanPhone,
    expiresAt,
    attempts: 0,
  });

  return { code, expiresAt };
}

/**
 * Verify OTP for a phone number
 */
export function verifyOtpCode(phone: string, inputCode: string): { success: boolean; error?: string } {
  const cleanPhone = phone.replace(/\D/g, "");
  const trimmedCode = inputCode.trim();

  // Test code bypass — ONLY outside production. This branch never runs when
  // NODE_ENV === "production", and there is no other path in this function
  // that accepts "123456" as a magic value.
  if (process.env.NODE_ENV !== "production" && trimmedCode === "123456") {
    return { success: true };
  }

  const entry = otpStore.get(cleanPhone);
  if (!entry) {
    return { success: false, error: "Doğrulama kodunun süresi dolmuş veya kod talep edilmemiş." };
  }

  if (Date.now() > entry.expiresAt) {
    otpStore.delete(cleanPhone);
    return { success: false, error: "Doğrulama kodunun süresi doldu. Lütfen yeni kod isteyin." };
  }

  if (entry.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(cleanPhone);
    return { success: false, error: "Çok fazla hatalı deneme yapıldı. Lütfen yeni bir kod isteyin." };
  }

  entry.attempts += 1;

  if (entry.code !== trimmedCode) {
    return { success: false, error: "Girdiğiniz 6 haneli kod hatalı." };
  }

  // Verified successfully, delete token so it cannot be reused
  otpStore.delete(cleanPhone);
  return { success: true };
}
