/**
 * Central Environment Configuration & Safe Validator
 *
 * In development, missing values fall back to convenience defaults so local
 * setup stays zero-config. In production, the same defaults are refused —
 * assertProductionSecrets() throws at module load if a real value was never
 * set, instead of silently running with a secret every visitor can read
 * in this file.
 */

const INSECURE_DEFAULT_JWT_SECRET = "esnafca-super-secure-jwt-secret-key-2026-enterprise";
const INSECURE_DEFAULT_ADMIN_PASSWORD = "esnafca2026!";

const IS_PROD = process.env.NODE_ENV === "production";

export const IS_BUILD_PHASE =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.npm_lifecycle_event === "build" ||
  (Array.isArray(process.argv) && process.argv.includes("build")) ||
  Boolean(process.env.NEXT_BUILD);

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  IS_PROD,
  IS_BUILD_PHASE,

  // Database
  DATABASE_URL: process.env.DATABASE_URL || "file:./dev.db",

  // Security & JWT
  JWT_SECRET: process.env.JWT_SECRET || INSECURE_DEFAULT_JWT_SECRET,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || INSECURE_DEFAULT_ADMIN_PASSWORD,

  // Storage / Uploads
  STORAGE_PROVIDER: (process.env.STORAGE_PROVIDER as "local" | "supabase" | "r2") || "local",
  UPLOAD_DIR: process.env.UPLOAD_DIR || "public/uploads",
  STORAGE_PUBLIC_URL: process.env.STORAGE_PUBLIC_URL || "/uploads",

  // Payment Providers (Phase 2)
  PAYMENT_PROVIDER: (process.env.PAYMENT_PROVIDER as "mock" | "iyzico" | "paytr") || "mock",
  IYZICO_API_KEY: process.env.IYZICO_API_KEY || "",
  IYZICO_SECRET_KEY: process.env.IYZICO_SECRET_KEY || "",
  IYZICO_BASE_URL: process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com",
  // Shared secret the payment provider (or our own mock flow) must present
  // on every call to /api/payments/webhook. Required in production.
  PAYMENT_WEBHOOK_SECRET: process.env.PAYMENT_WEBHOOK_SECRET || "",
};

export function assertProductionSecrets(): void {
  if (!IS_PROD) return;

  const problems: string[] = [];
  if (env.JWT_SECRET === INSECURE_DEFAULT_JWT_SECRET) {
    problems.push("JWT_SECRET tanımlanmamış — kaynak kodundaki herkese açık varsayılan değer kullanılıyor.");
  }
  if (env.ADMIN_PASSWORD === INSECURE_DEFAULT_ADMIN_PASSWORD) {
    problems.push("ADMIN_PASSWORD tanımlanmamış — kaynak kodundaki herkese açık varsayılan değer kullanılıyor.");
  }
  if (!env.PAYMENT_WEBHOOK_SECRET) {
    problems.push("PAYMENT_WEBHOOK_SECRET tanımlanmamış — ödeme webhook'u kimseyi doğrulamadan kabul eder.");
  }

  if (problems.length > 0) {
    const errorMessage =
      "Üretim ortamı başlatılamadı, zorunlu ortam değişkenleri eksik:\n- " +
      problems.join("\n- ") +
      "\n\n.env.example dosyasına bakın ve bu değerleri gerçek, gizli değerlerle tanımlayın.";

    if (IS_BUILD_PHASE) {
      console.warn(
        `\n⚠️ [BUILD WARNING] Eksik üretim ortam değişkenleri tespit edildi:\n- ${problems.join(
          "\n- "
        )}\nNext.js build aşamasında devam ediliyor; canlı sunucuda (runtime) bu değişkenlerin girilmesi zorunludur.\n`
      );
      return;
    }

    throw new Error(errorMessage);
  }
}

// Validate environment on module load
assertProductionSecrets();
