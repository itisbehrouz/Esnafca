/**
 * Comprehensive Automated Verification Suite for Esnafça Boost Phases 1-6
 */

import { prisma } from "../src/lib/db";
import { signAdminToken } from "../src/lib/auth";
import {
  getAdminFinanceMetrics,
  extendSubscriptionAction,
  grantGiftMonthAction,
  refundSubscriptionAction,
  retryFailedPaymentAction,
  getAdminMerchantDetails,
  updateMerchantDetailsAction,
  getAdminLogisticsData,
  createStandShipmentAction,
  updateLogisticsStatusAction,
  getAdminStaffData,
  createStaffMemberAction,
  updateStaffMemberStatusAction,
  getAdminMapCoverageData,
  getAdminDashboardMetrics,
  getAdminAuditLogs,
  getAdminNotifications,
  getPendingApplicationsCount,
} from "../src/app/actions/admin";

// Enable admin session for test environment
process.env.TEST_ADMIN_SESSION = "true";

async function runBoostVerificationSuite() {
  console.log("================================================================");
  console.log("🚀  ESNAFÇA BOOST (FAZ 1 - FAZ 6) DERİN DOĞRULAMA TESTİ  🚀");
  console.log("================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, title: string, details?: string) {
    if (condition) {
      console.log(`  ✅ [GEÇTİ] ${title}`);
      passed++;
    } else {
      console.error(`  ❌ [BAŞARISIZ] ${title}${details ? ` -> ${details}` : ""}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // FAZ 1: FİNANS, ABONELİK & TAHSİLAT MASASI TESTLERİ
    // -------------------------------------------------------------
    console.log("📦 [FAZ 1] Finans, MRR, Webhook & Tahsilat Masası Testleri");

    const financeRes = await getAdminFinanceMetrics();
    assert(financeRes.success === true && Boolean(financeRes.data), "Finans metrikleri başarıyla çekildi");
    const finData = financeRes.data!;
    assert(typeof finData.totalMRR === "number" && finData.totalMRR > 0, "MRR hesabı doğru yapıldı (> 0 ₺)");
    assert(finData.totalARR === finData.totalMRR * 12, "ARR hesabı (12x MRR) aritmetik olarak doğrulandı");
    assert(Array.isArray(finData.subscriptions), "Yinelenen abonelikler listesi dizi olarak döndü");
    assert(Array.isArray(finData.payments), "Tahsilat & webhook hareketleri listesi döndü");

    // Test Extend Subscription
    const targetMerchant = await prisma.merchant.findFirst({ where: { tier: { in: ["pro", "plus"] } } });
    if (targetMerchant) {
      const extendRes = await extendSubscriptionAction(targetMerchant.id, 2, "Otomasyon testi süre uzatımı");
      assert(extendRes.success === true, "Esnaf aboneliği başarıyla 2 ay uzatıldı");

      // Verify Audit Log
      const auditLog = await prisma.adminAuditLog.findFirst({
        where: { action: "EXTEND_SUBSCRIPTION", targetId: targetMerchant.id },
        orderBy: { createdAt: "desc" },
      });
      assert(Boolean(auditLog), "Abonelik uzatma işlemi AdminAuditLog kütüğüne yazıldı");

      // Test Gift Month
      const giftRes = await grantGiftMonthAction(targetMerchant.id, 1, "Sadakat telafisi test");
      assert(giftRes.success === true, "Dükkana 1 ay hediye tanımlandı");

      const giftAudit = await prisma.adminAuditLog.findFirst({
        where: { action: "GRANT_GIFT_MONTH", targetId: targetMerchant.id },
        orderBy: { createdAt: "desc" },
      });
      assert(Boolean(giftAudit), "Hediye ay işlemi AdminAuditLog kütüğüne yazıldı");
    }

    // Edge Case Test: Extend an expired subscription (ensure periodEnd starts from now, not past date)
    const testExpiredMerchant = await prisma.merchant.create({
      data: {
        id: `test-exp-${Date.now()}`,
        slug: `test-exp-${Date.now()}`,
        name: "Süresi Dolmuş Test Esnafı",
        craftTitle: "Test Usta",
        masterName: "Test Usta",
        category: "berber",
        city: "İstanbul",
        district: "Kadıköy",
        neighborhood: "Moda",
        address: "Test Adres No: 1",
        phone: "05550000001",
        whatsapp: "905550000001",
        tier: "free",
        verified: false,
        bio: "Test biyografi",
        heroImage: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1",
        galleryImages: [],
        specialties: [],
        features: {},
        workingHours: { weekdays: "09:00 - 19:00" },
      },
    });

    const pastDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days ago
    await prisma.subscription.create({
      data: {
        merchantId: testExpiredMerchant.id,
        tier: "pro",
        price: 390,
        status: "active",
        billingInterval: "monthly",
        currentPeriodEnd: pastDate,
        nextRenewalDate: pastDate,
      },
    });

    const extendExpiredRes = await extendSubscriptionAction(testExpiredMerchant.id, 1, "Süresi dolmuş esnaf uzatımı");
    assert(extendExpiredRes.success === true, "Süresi dolmuş esnafın aboneliği başarıyla uzatıldı");
    const updatedSub = await prisma.subscription.findFirst({
      where: { merchantId: testExpiredMerchant.id },
      orderBy: { currentPeriodEnd: "desc" },
    });
    assert(
      Boolean(updatedSub && new Date(updatedSub.currentPeriodEnd).getTime() > Date.now()),
      "Süresi dolmuş abonelik geçmişten değil bugünden itibaren uzatıldı"
    );

    // Verify free merchant was upgraded to pro with verification
    const upgradedMerchant = await prisma.merchant.findUnique({ where: { id: testExpiredMerchant.id } });
    assert(upgradedMerchant?.tier === "pro", "Ücretsiz esnaf abonelik uzatımı ile 'pro' paketine yükseltildi");
    assert(upgradedMerchant?.verified === true, "Yükseltilen esnafa doğrulama rozeti verildi");

    // Test Payment Retry & Subscription Reactivation
    const pastDueSub = await prisma.subscription.create({
      data: {
        merchantId: testExpiredMerchant.id,
        tier: "pro",
        price: 390,
        status: "past_due",
        billingInterval: "monthly",
        currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        nextRenewalDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      },
    });

    const retryTx = await prisma.paymentTransaction.create({
      data: {
        merchantId: testExpiredMerchant.id,
        amount: 390,
        currency: "TRY",
        status: "FAILED",
        provider: "iyzico",
        paymentId: `pay_test_retry_${Date.now()}`,
        failureReason: "Limit yetersiz",
      },
    });

    const retryRes = await retryFailedPaymentAction(retryTx.paymentId);
    assert(retryRes.success === true, "Başarısız ödeme kurtarma işlemi başarıyla tetiklendi");
    const reactivatedSub = await prisma.subscription.findUnique({ where: { id: pastDueSub.id } });
    assert(reactivatedSub?.status === "active", "Kurtarılan ödeme ile esnaf aboneliği 'active' durumuna getirildi");

    // Test Payment Refund & Subscription Cancellation
    const refundTx = await prisma.paymentTransaction.create({
      data: {
        merchantId: testExpiredMerchant.id,
        amount: 390,
        currency: "TRY",
        status: "SUCCESS",
        provider: "paytr",
        paymentId: `pay_test_refund_${Date.now()}`,
      },
    });

    const refundRes = await refundSubscriptionAction(refundTx.paymentId, "Müşteri memnuniyetsizliği iadesi");
    assert(refundRes.success === true, "Ödeme iade işlemi (refund) başarıyla tamamlandı");
    const cancelledSub = await prisma.subscription.findUnique({ where: { id: pastDueSub.id } });
    assert(cancelledSub?.status === "cancelled", "İade edilen ödemeye ait aktif abonelik iptal edildi (cancelled)");

    // Clean up test merchant and relations
    await prisma.subscription.deleteMany({ where: { merchantId: testExpiredMerchant.id } });
    await prisma.paymentTransaction.deleteMany({ where: { merchantId: testExpiredMerchant.id } });
    await prisma.merchant.delete({ where: { id: testExpiredMerchant.id } });

    // -------------------------------------------------------------
    // FAZ 2: ESNAF DERİN DÜZENLEYİCİ & MENÜ MASASI TESTLERİ
    // -------------------------------------------------------------
    console.log("\n📦 [FAZ 2] Esnaf Derin Düzenleyici & Menü Masası CRUD Testleri");

    const sampleMerchant = await prisma.merchant.findFirst({ include: { services: true } });
    if (sampleMerchant) {
      const detailRes = await getAdminMerchantDetails(sampleMerchant.id);
      assert(detailRes.success === true && detailRes.data?.name === sampleMerchant.name, "Esnaf detayları ve ilişkili modeller çekildi");

      const originalServices = sampleMerchant.services.map((s) => ({
        name: s.name,
        description: s.description,
        minPrice: s.minPrice,
        maxPrice: s.maxPrice,
        isStartingPrice: s.isStartingPrice,
        estimatedDuration: s.estimatedDuration,
        popular: s.popular,
      }));

      // Execute Update Action
      const testUpdateName = `${sampleMerchant.name} (Doğrulandı)`;
      const updatePayload = {
        name: testUpdateName,
        masterName: sampleMerchant.masterName,
        craftTitle: sampleMerchant.craftTitle,
        category: sampleMerchant.category,
        bio: "Otomasyon testi tarafından güncellenen biyografi.",
        experienceYears: 15,
        phone: sampleMerchant.phone,
        whatsapp: sampleMerchant.whatsapp,
        city: sampleMerchant.city,
        district: sampleMerchant.district,
        neighborhood: sampleMerchant.neighborhood,
        address: sampleMerchant.address,
        latitude: 41.0430,
        longitude: 29.0080,
        isOpenNow: true,
        heroImage: sampleMerchant.heroImage,
        galleryImages: ["https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80"],
        services: [
          {
            name: "Otomasyon Özel Kesim",
            minPrice: 250,
            maxPrice: 350,
            popular: true,
            estimatedDuration: "40 dk",
          },
          {
            name: "Sakal & Sıcak Havlu",
            minPrice: 150,
            maxPrice: 180,
            popular: false,
            estimatedDuration: "25 dk",
          },
        ],
      };

      const updateRes = await updateMerchantDetailsAction(sampleMerchant.id, updatePayload);
      assert(updateRes.success === true, "Derin düzenleyici verisi başarıyla kaydedildi");

      // Verify in DB
      const verifiedMerchantInDb = await prisma.merchant.findUnique({
        where: { id: sampleMerchant.id },
        include: { services: true },
      });
      assert(verifiedMerchantInDb?.name === testUpdateName, "Dükkan adı veritabanında güncellendi");
      assert(verifiedMerchantInDb?.minPrice === 150, "En düşük fiyat (minPrice) menüden otomatik hesaplandı (150 ₺)");
      assert(verifiedMerchantInDb?.maxPrice === 350, "En yüksek fiyat (maxPrice) menüden otomatik hesaplandı (350 ₺)");
      assert(verifiedMerchantInDb?.services.length === 2, "Hizmet menüsü CRUD işlemleriyle 2 hizmete senkronize edildi");

      // Revert merchant and services back
      await prisma.serviceItem.deleteMany({ where: { merchantId: sampleMerchant.id } });
      if (originalServices.length > 0) {
        await prisma.serviceItem.createMany({
          data: originalServices.map((s) => ({
            merchantId: sampleMerchant.id,
            name: s.name,
            description: s.description,
            minPrice: s.minPrice,
            maxPrice: s.maxPrice,
            isStartingPrice: s.isStartingPrice,
            estimatedDuration: s.estimatedDuration,
            popular: s.popular,
          })),
        });
      }
      await prisma.merchant.update({
        where: { id: sampleMerchant.id },
        data: {
          name: sampleMerchant.name,
          minPrice: sampleMerchant.minPrice,
          maxPrice: sampleMerchant.maxPrice,
          bio: sampleMerchant.bio,
          experienceYears: sampleMerchant.experienceYears,
        },
      });
    }

    // -------------------------------------------------------------
    // FAZ 3: FİZİKİ AKRİLİK STAND & LOJİSTİK MASASI TESTLERİ
    // -------------------------------------------------------------
    console.log("\n📦 [FAZ 3] Akrilik Stand & Lojistik Masası Testleri");

    const logisticsRes = await getAdminLogisticsData();
    assert(logisticsRes.success === true, "Lojistik sevkiyat verileri çekildi");
    assert(typeof logisticsRes.data?.metrics?.totalShipments === "number", "Lojistik metrikleri doğrulandı");

    if (sampleMerchant) {
      // Create new stand shipment
      const createShipmentRes = await createStandShipmentAction(
        sampleMerchant.id,
        sampleMerchant.masterName,
        sampleMerchant.phone,
        "Kadıköy Moda Caddesi No: 42 Dükkan 3"
      );
      assert(createShipmentRes.success === true && Boolean(createShipmentRes.shipmentId), "Yeni pleksi stand sevkiyat siparişi oluşturuldu");

      const shipmentId = createShipmentRes.shipmentId!;

      // Update to SHIPPED with carrier & tracking
      const updateShipmentRes = await updateLogisticsStatusAction(
        shipmentId,
        "SHIPPED",
        "Yurtiçi Kargo",
        "YK9988776655",
        "Koli içeriği: A6 Pleksi T-stand + 2 Kapı Çıkartması"
      );
      assert(updateShipmentRes.success === true, "Kargo takip kodu (YK9988776655) ve SHIPPED durumu kaydedildi");

      const inDbShipment = await prisma.standShipment.findUnique({ where: { id: shipmentId } });
      assert(inDbShipment?.status === "SHIPPED" && inDbShipment.carrier === "Yurtiçi Kargo", "Sevkiyat DB doğrulaması yapıldı");

      // Clean up test shipment
      await prisma.standShipment.delete({ where: { id: shipmentId } });
    }

    // -------------------------------------------------------------
    // FAZ 4: ÇOKLU OPERATÖR & PERSONEL MASASI TESTLERİ
    // -------------------------------------------------------------
    console.log("\n📦 [FAZ 4] Personel & Çoklu Operatör RBAC Testleri");

    const staffRes = await getAdminStaffData();
    assert(staffRes.success === true, "Personel listesi çekildi");
    assert((staffRes.data?.staffMembers?.length ?? 0) >= 1, "Personel kadrosu mevcut");

    const admin = staffRes.data?.staffMembers?.find((s: any) => s.role === "SUPER_ADMIN");
    assert(admin?.role === "SUPER_ADMIN", "En az bir SUPER_ADMIN rolünde personel mevcut");
    assert(
      typeof staffRes.data?.assignedQueues?.pendingApplications === "number" &&
      typeof staffRes.data?.assignedQueues?.pendingPrintShipments === "number",
      "Personel masasında atanmış canlı operasyon kuyrukları ve iş yükü metrikleri doğrulandı"
    );

    const testStaffEmail = `test.operator.${Date.now()}@example.com`;
    const createStaffRes = await createStaffMemberAction({
      name: "Test Operatör",
      email: testStaffEmail,
      phone: "0539 000 11 22",
      role: "OPERATOR",
      title: "Saha Triyaj Uzmanı",
    });
    assert(createStaffRes.success === true && Boolean(createStaffRes.memberId), "Yeni OPERATOR personeli oluşturuldu");

    if (createStaffRes.memberId) {
      const toggleRes = await updateStaffMemberStatusAction(createStaffRes.memberId, "ON_LEAVE");
      assert(toggleRes.success === true, "Personel durumu ON_LEAVE olarak güncellendi");
      
      // Cleanup test member
      await prisma.staffMember.delete({ where: { id: createStaffRes.memberId } });
    }

    // -------------------------------------------------------------
    // FAZ 5: MAHALLENİN ZANAATKAR KAPSAMA HARİTASI TESTLERİ
    // -------------------------------------------------------------
    console.log("\n📦 [FAZ 5] Zanaatkar Kapsama Haritası & Arz Boşluğu Tespiti");

    const mapRes = await getAdminMapCoverageData();
    assert(mapRes.success === true, "Harita kapsama verileri hesaplandı");
    assert(Array.isArray(mapRes.data?.merchants), "Harita koordinatlı esnaflar listelendi");
    assert(typeof mapRes.data?.districtStats === "object", "İlçe bazında kümeleme (districtStats) oluşturuldu");
    assert(Array.isArray(mapRes.data?.supplyGaps), "Kritik arz açıkları ve fırsat analizleri üretildi");

    // -------------------------------------------------------------
    // FAZ 6: CANLI OPERASYON TELEMETRİSİ, AUDIT LOG & SİSTEM BÜTÜNLÜĞÜ
    // -------------------------------------------------------------
    console.log("\n📦 [FAZ 6] Canlı Operasyon Telemetrisi, Audit Log & Sistem Bütünlüğü");

    const dashboardMetricsRes = await getAdminDashboardMetrics();
    assert(dashboardMetricsRes.success === true && Boolean(dashboardMetricsRes.data), "Admin dashboard ana metrikleri başarıyla çekildi");
    assert(typeof dashboardMetricsRes.data?.totalMerchants === "number", "Toplam esnaf sayısı doğrulandı");
    assert(typeof dashboardMetricsRes.data?.paidSubscribersCount === "number", "Ücretli abone sayısı hesaplandı");
    assert(Array.isArray(dashboardMetricsRes.data?.recentLogs), "Son operasyon kütükleri listelendi");

    const auditLogsRes = await getAdminAuditLogs(10);
    assert(auditLogsRes.success === true, "Admin audit log kütüğü başarıyla sorgulandı");
    assert(Array.isArray(auditLogsRes.data), "Audit kayıtları dizi olarak döndü");

    const notificationsRes = await getAdminNotifications();
    assert(notificationsRes.success === true, "Operatör bildirimleri ve bekleyen iş yükü sorgulandı");
    assert(typeof notificationsRes.unreadCount === "number", "Okunmamış bildirim sayısı hesaplandı");

    const pendingCountRes = await getPendingApplicationsCount();
    assert(pendingCountRes.success === true && typeof pendingCountRes.count === "number", "Bekleyen başvuru sayısı canlı sorgulandı");

    console.log("\n================================================================");
    console.log(`📊 TEST RAPORU: ${passed} Başarılı Test, ${failed} Hata`);
    console.log("================================================================");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("Test execution error:", error);
    process.exit(1);
  }
}

runBoostVerificationSuite()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Boost verification suite failed with exception:", e);
    process.exit(1);
  });
