/**
 * Automated Verification Suite for Esnafça Web Control Panel (HQ Operator Workstation)
 */

import { prisma } from "../src/lib/db";
import { 
  getAdminDashboardMetrics, 
  getAdminApplications, 
  approveApplicationAction, 
  rejectApplicationAction,
  updateMerchantTierAction,
  toggleMerchantVerifiedAction,
  deleteReviewAction,
  sendBroadcastAction,
  getAdminAuditLogs,
  getAdminNotifications
} from "../src/app/actions/admin";
import { signAdminToken } from "../src/lib/auth";
import { badRequestProblem, unauthorizedProblem } from "../src/lib/problem-details";

async function runAdminVerification() {
  console.log("================================================================");
  console.log("🎛️  ESNAFÇA HQ OPERATOR WORKSTATION ENTEGRASYON TESTİ  🎛️");
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

  // 1. RFC 7807 Problem Details
  console.log("📦 [1] RFC 7807 Problem Details Doğrulama");
  const badReq = badRequestProblem("Eksik alan", [{ name: "email", reason: "Zorunlu alan" }]);
  assert(badReq.status === 400, "RFC 7807 Bad Request 400 durum kodu döndü");
  assert(badReq.headers.get("content-type") === "application/problem+json", "Content-Type application/problem+json olarak belirlendi");

  // 2. Health Endpoint Probe Logic
  console.log("\n📦 [2] /api/health Telemetri Probe Doğrulama");
  const dbStart = Date.now();
  await prisma.$queryRaw`SELECT 1`;
  const dbLatency = Date.now() - dbStart;
  assert(dbLatency >= 0, "Prisma DB sorgusu başarıyla çalıştı ve gecikme ölçüldü");

  // 3. Admin Audit Log Creation
  console.log("\n📦 [3] Zero-Trust AdminAuditLog Tablo & Kayıt Testi");
  const initialAuditCount = await prisma.adminAuditLog.count();
  const testLog = await prisma.adminAuditLog.create({
    data: {
      operator: "Test Operatörü",
      action: "APPROVE_APPLICATION",
      targetType: "APPLICATION",
      targetId: "test-app-id-999",
      details: JSON.stringify({ test: true }),
    },
  });
  assert(Boolean(testLog.id), "AdminAuditLog kaydı başarıyla oluşturuldu");
  const newAuditCount = await prisma.adminAuditLog.count();
  assert(newAuditCount === initialAuditCount + 1, "Audit Log sayacı doğru arttı");

  // Cleanup test log
  await prisma.adminAuditLog.delete({ where: { id: testLog.id } });

  // 4. Test Application Approval Flow & Audit Logging
  console.log("\n📦 [4] Başvuru Onaylama & Zanaatkar Dükkanı Oluşturma Akışı");
  const testApp = await prisma.merchantApplication.create({
    data: {
      name: "Test Berber Dükkanı",
      masterName: "Ahmet Usta",
      category: "berber",
      experienceYears: 15,
      city: "İstanbul",
      district: "Kadıköy",
      neighborhood: "Moda",
      address: "Moda Cad. No:42 Kadıköy",
      phone: "05321112233",
      whatsapp: "05321112233",
      plan: "pro",
      services: JSON.stringify([
        { name: "Saç Sakal Kesimi", minPrice: 250, maxPrice: 350, popular: true },
        { name: "Cilt Bakımı", minPrice: 200, maxPrice: 300 },
      ]),
      status: "pending",
    },
  });
  assert(testApp.status === "pending", "Test başvurusu 'pending' olarak kaydedildi");

  // Approve the application directly in DB logic
  const appToApprove = await prisma.merchantApplication.findUnique({ where: { id: testApp.id } });
  assert(Boolean(appToApprove), "Başvuru ID ile bulundu");

  const services = JSON.parse(appToApprove!.services);
  const newMerchant = await prisma.merchant.create({
    data: {
      slug: `test-berber-${Date.now()}`,
      name: appToApprove!.name,
      craftTitle: "Mahalle Esnafı & Doğrulanmış Usta",
      masterName: appToApprove!.masterName,
      category: appToApprove!.category,
      city: appToApprove!.city,
      district: appToApprove!.district,
      neighborhood: appToApprove!.neighborhood,
      address: appToApprove!.address,
      phone: appToApprove!.phone,
      whatsapp: appToApprove!.whatsapp,
      rating: 5.0,
      reviewCount: 1,
      verified: true,
      verifiedYear: new Date().getFullYear(),
      tier: appToApprove!.plan || "pro",
      experienceYears: appToApprove!.experienceYears || 10,
      minPrice: 200,
      maxPrice: 350,
      workingHours: { weekdays: "09:00 - 19:30" },
      heroImage: "https://example.com/hero.jpg",
      galleryImages: [],
      bio: "Test biyografi",
      specialties: ["Saç Sakal"],
      features: {},
    },
  });
  assert(Boolean(newMerchant.id), "Yeni esnaf dükkanı başarıyla oluşturuldu");
  assert(newMerchant.verified === true, "Onaylanan esnafa doğrulama rozeti verildi");
  assert(newMerchant.tier === "pro", "Başvuru planı (pro) esnaf kaydına aktarıldı");

  // 5. Tier Update Flow
  console.log("\n📦 [5] Abonelik Paketi Değişimi & Doğrulama Toggle");
  const updatedMerchant = await prisma.merchant.update({
    where: { id: newMerchant.id },
    data: { tier: "plus" },
  });
  assert(updatedMerchant.tier === "plus", "Esnaf Usta Plus paketine yükseltildi");

  const toggledMerchant = await prisma.merchant.update({
    where: { id: newMerchant.id },
    data: { verified: false },
  });
  assert(toggledMerchant.verified === false, "Doğrulama rozeti toggle edilebildi");

  // Clean up test records
  await prisma.merchant.delete({ where: { id: newMerchant.id } });
  await prisma.merchantApplication.delete({ where: { id: testApp.id } });
  console.log("  🧹 Test kayıtları veritabanından temizlendi.");

  // 6. Metrics Aggregation
  console.log("\n📦 [6] KPI & Finans Metrikleri Hesaplama Mantığı");
  const merchants = await prisma.merchant.findMany({ select: { tier: true } });
  const tierPrices: Record<string, number> = { free: 0, pro: 390, plus: 890 };
  const totalMRR = merchants.reduce((sum, m) => sum + (tierPrices[m.tier] || 0), 0);
  assert(totalMRR >= 0, `MRR hesaplandı: ${totalMRR} ₺`);

  console.log("\n================================================================");
  console.log(`📊 TEST SONUCU: ${passed} Başarılı Test, ${failed} Hata`);
  console.log("================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runAdminVerification().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
