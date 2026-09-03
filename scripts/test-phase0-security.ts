/**
 * Phase 0 Security & Authentication Automated Verification Script
 */

import { signMerchantToken, signAdminToken, verifyMerchantToken, verifyAdminToken } from "../src/lib/auth";
import { generateOtp, verifyOtpCode } from "../src/lib/otp";

async function runTests() {
  console.log("==================================================");
  console.log("🛡️  ESNAFÇA FAZ 0 - GÜVENLİK TESTLERİ BAŞLIYOR  🛡️");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, title: string) {
    if (condition) {
      console.log(`✅ [GEÇTİ] ${title}`);
      passed++;
    } else {
      console.error(`❌ [BAŞARISIZ] ${title}`);
      failed++;
    }
  }

  // TEST 1: OTP Generation and Verification
  console.log("--- 1. OTP Sistemi Testleri ---");
  const phone = "05321112233";
  const { code, expiresAt } = generateOtp(phone);
  assert(code.length === 6, "OTP kodu 6 haneli üretildi");
  assert(expiresAt > Date.now(), "OTP geçerlilik süresi ileri bir tarihte");

  const wrongCodeRes = verifyOtpCode(phone, "999999");
  // in dev mode 123456 is bypass, but 999999 should fail unless random code is 999999
  if (code !== "999999") {
    assert(!wrongCodeRes.success, "Hatalı kod (999999) reddedildi");
  }

  const validCodeRes = verifyOtpCode(phone, code);
  assert(validCodeRes.success, "Doğru OTP kodu başarıyla doğrulandı");

  // TEST 2: JWT Merchant Signing & Verification
  console.log("\n--- 2. Esnaf JWT Oturum Testleri ---");
  const testMerchant = {
    id: "cmtest123456789",
    phone: "05321112233",
    slug: "usta-mehmet-oto-tamir",
  };

  const merchantToken = await signMerchantToken(testMerchant);
  assert(typeof merchantToken === "string" && merchantToken.length > 20, "Esnaf JWT token oluşturuldu");

  const verifiedMerchantPayload = await verifyMerchantToken(merchantToken);
  assert(
    verifiedMerchantPayload !== null &&
    verifiedMerchantPayload.id === testMerchant.id &&
    verifiedMerchantPayload.role === "merchant",
    "Esnaf JWT token doğrulandı ve payload eşleşti"
  );

  const invalidMerchantToken = merchantToken.slice(0, -5) + "abcde";
  const invalidVerified = await verifyMerchantToken(invalidMerchantToken);
  assert(invalidVerified === null, "Bozulmuş JWT token geçersiz sayıldı");

  // TEST 3: Admin JWT Signing & Verification
  console.log("\n--- 3. Yönetici (Admin) JWT Testleri ---");
  const adminToken = await signAdminToken();
  assert(typeof adminToken === "string" && adminToken.length > 20, "Admin JWT token oluşturuldu");

  const isAdminValid = await verifyAdminToken(adminToken);
  assert(isAdminValid === true, "Admin JWT token doğrulandı");

  // TEST 4: Role Separation Test
  console.log("\n--- 4. Rol Ayrımı (Role Separation) Testi ---");
  const isMerchantAdmin = await verifyAdminToken(merchantToken);
  assert(!isMerchantAdmin, "Esnaf token'ı yönetici (admin) olarak KABUL EDİLMEDİ (Yetki aşımı engellendi)");

  const isMerchantFromAdmin = await verifyMerchantToken(adminToken);
  assert(isMerchantFromAdmin === null, "Admin token'ı esnaf oturumu olarak KABUL EDİLMEDİ");

  console.log("\n==================================================");
  console.log(`📊 TEST SONUCU: ${passed} Başarılı, ${failed} Başarısız`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
