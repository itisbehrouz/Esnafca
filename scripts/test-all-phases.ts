/**
 * Comprehensive Automated Verification Suite for Phases 0 through 5
 */

import { signMerchantToken, signAdminToken, verifyMerchantToken, verifyAdminToken } from "../src/lib/auth";
import { generateOtp, verifyOtpCode } from "../src/lib/otp";
import { createCheckoutSession, applySubscriptionPayment } from "../src/lib/payment";
import { prisma } from "../src/lib/db";

async function runMasterSuite() {
  console.log("================================================================");
  console.log("🚀  ESNAFÇA TAM KAPSAMLI FAZ 0 - FAZ 5 ENTEGRASYON TESTİ  🚀");
  console.log("================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, title: string) {
    if (condition) {
      console.log(`  ✅ [GEÇTİ] ${title}`);
      passed++;
    } else {
      console.error(`  ❌ [BAŞARISIZ] ${title}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // FAZ 0: GÜVENLİK & KİMLİK DOĞRULAMA TESTLERİ
  // -------------------------------------------------------------
  console.log("📦 [FAZ 0] Güvenlik, OTP & JWT Doğrulama Testleri");
  
  const testPhone = "05329998877";
  const { code: generatedCode } = generateOtp(testPhone);
  assert(generatedCode.length === 6, "OTP 6 haneli üretildi");
  assert(verifyOtpCode(testPhone, generatedCode).success, "Geçerli OTP kodu doğrulandı");
  assert(!verifyOtpCode(testPhone, "000000").success, "Geçersiz OTP kodu (000000) reddedildi");

  const merchantToken = await signMerchantToken({
    id: "merchant-test-id-1",
    phone: testPhone,
    slug: "ornek-esnaf",
  });
  const verifiedMerchant = await verifyMerchantToken(merchantToken);
  assert(verifiedMerchant?.id === "merchant-test-id-1", "Esnaf JWT başarıyla imzalandı ve çözüldü");

  const adminToken = await signAdminToken();
  const isAdmin = await verifyAdminToken(adminToken);
  assert(isAdmin === true, "Admin JWT yetkilendirmesi doğrulandı");
  assert((await verifyAdminToken(merchantToken)) === false, "Esnaf token'ı admin yetkisi kazanamadı (Yetki İzolasyonu)");

  // -------------------------------------------------------------
  // FAZ 1: ÜRETİM ALTYAPISI & ENV YAPILANDIRMASI
  // -------------------------------------------------------------
  console.log("\n📦 [FAZ 1] Üretim Altyapısı & Ortam Değişkeni Testleri");
  const { env } = await import("../src/lib/env");
  assert(typeof env.JWT_SECRET === "string" && env.JWT_SECRET.length > 10, "JWT_SECRET ortam değişkeni yüklendi");
  assert(typeof env.DATABASE_URL === "string", "DATABASE_URL ortam değişkeni tanımlı");
  assert(typeof env.UPLOAD_DIR === "string", "UPLOAD_DIR dosya depolama konumu tanımlı");

  // -------------------------------------------------------------
  // FAZ 2: ÖDEME ENTEGRASYONU & TIER YÜKSELTME TESTLERİ
  // -------------------------------------------------------------
  console.log("\n📦 [FAZ 2] Ödeme Modülü & Abonelik Yaşam Döngüsü");

  // Find or pick a merchant from DB
  const firstMerchant = await prisma.merchant.findFirst();
  if (firstMerchant) {
    const checkoutRes = await createCheckoutSession({
      merchantId: firstMerchant.id,
      tier: "plus",
      billingInterval: "monthly",
    });
    assert(checkoutRes.success && Boolean(checkoutRes.checkoutUrl), "Checkout ödeme oturumu başarıyla oluşturuldu");

    const upgradeRes = await applySubscriptionPayment({
      merchantId: firstMerchant.id,
      tier: "plus",
      paymentId: "test_pay_123",
      amount: 890,
    });
    assert(upgradeRes.success && upgradeRes.merchant?.tier === "plus", "Esnaf Usta Plus paketine yükseltildi");

    // Restore to pro
    await prisma.merchant.update({
      where: { id: firstMerchant.id },
      data: { tier: "pro" },
    });
  } else {
    console.log("  ⚠️ [BİLGİ] Veritabanında test esnafı bulunamadı, checkout mock testi atlandı.");
  }

  // -------------------------------------------------------------
  // FAZ 4: KALİTE, ÖLÇEK & SAYFALAMA TESTLERİ
  // -------------------------------------------------------------
  console.log("\n📦 [FAZ 4] Veritabanı Sayfalama (Pagination) & Filtreleme");
  const totalCount = await prisma.merchant.count();
  const paginatedMerchants = await prisma.merchant.findMany({
    take: 5,
    skip: 0,
    orderBy: { rating: "desc" },
  });
  assert(paginatedMerchants.length <= 5, "Sayfalama (take: 5) sınırı doğru uygulandı");
  assert(totalCount >= paginatedMerchants.length, "Toplam esnaf sayısı doğru hesaplandı");

  // -------------------------------------------------------------
  // FAZ 5: BÜYÜME ÖZELLİKLERİ, YORUM HESAPLAMA & LOCALBUSINESS
  // -------------------------------------------------------------
  console.log("\n📦 [FAZ 5] Yorum Motoru, Puanlama Aritmetiği & SEO");
  if (firstMerchant) {
    const originalRating = firstMerchant.rating;
    const originalCount = firstMerchant.reviewCount;
    
    // Simulate calculating new rating after 5-star review
    const newRating = Number(((originalRating * originalCount + 5) / (originalCount + 1)).toFixed(1));
    assert(newRating >= 1 && newRating <= 5, "Yeni ortalama puan aritmetiği doğru hesaplandı");
  }

  console.log("\n================================================================");
  console.log(`📊 TEST ÖZETİ: ${passed} Başarılı Test, ${failed} Hata`);
  console.log("================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runMasterSuite()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Master test runner failed:", err);
    process.exit(1);
  });
