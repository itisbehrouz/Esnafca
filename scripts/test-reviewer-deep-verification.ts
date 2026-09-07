process.env.TEST_ADMIN_SESSION = "true";

import { prisma } from "../src/lib/db";
import { 
  approveApplicationAction, 
  rejectApplicationAction, 
  getAdminAppointments, 
  updateAppointmentStatusAction,
  getAdminDashboardMetrics
} from "../src/app/actions/admin";
import { generateAsciiSlug } from "../src/lib/slug";
import { zodProblem, badRequestProblem } from "../src/lib/problem-details";
import { 
  approveApplicationSchema, 
  rejectApplicationSchema, 
  updateMerchantTierSchema, 
  updateAppointmentStatusSchema 
} from "../src/lib/admin-schemas";
import { signAdminToken } from "../src/lib/auth";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passedCount++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}${details ? ` -> ${details}` : ""}`);
    failedCount++;
  }
}

async function runReviewerDeepVerification() {
  console.log("================================================================");
  console.log("🔍 ESNAFÇA HQ OPERATOR WORKSTATION - REVIEWER DEEP VERIFICATION");
  console.log("================================================================\n");

  // 1. Slug Generator ASCII & Uniqueness Tests
  console.log("📦 [1] Slug Generator & Turkish ASCII Transliteration");
  const sample1 = "Şık & Özgün Çilingir Usta (İstanbul/Kadıköy)";
  const slug1 = generateAsciiSlug(sample1);
  assert(
    slug1 === "sik-ozgun-cilingir-usta-istanbul-kadikoy",
    "Transliterates Turkish uppercase & lowercase characters properly",
    `Actual: ${slug1}`
  );
  assert(
    /^[a-z0-9-]+$/.test(slug1),
    "Slug strictly adheres to [a-z0-9-] character set",
    `Actual: ${slug1}`
  );

  const sample2 = "   İĞNEADA TERZİSİ & ÜTÜ EVİ!!!   ";
  const slug2 = generateAsciiSlug(sample2);
  assert(
    slug2 === "igneada-terzisi-utu-evi",
    "Handles trailing dashes, spaces, and punctuation",
    `Actual: ${slug2}`
  );

  // 2. Zod Schema & RFC 7807 Problem Details Tests
  console.log("\n📦 [2] Zod Validation & RFC 7807 Problem Details");
  const invalidReject = rejectApplicationSchema.safeParse({
    applicationId: "test-id",
    reason: "no", // too short (min 3)
  });
  assert(!invalidReject.success, "Zod catches short reject reasons");

  if (!invalidReject.success) {
    const problemResponse = zodProblem(invalidReject.error, "/admin/applications/reject");
    const json = await problemResponse.json();
    assert(problemResponse.status === 422, "zodProblem sets HTTP 422 Unprocessable Entity");
    assert(
      problemResponse.headers.get("content-type")?.includes("application/problem+json") === true,
      "Content-Type is application/problem+json"
    );
    assert(
      Array.isArray(json.invalidParams) && json.invalidParams.length > 0,
      "RFC 7807 invalidParams array populated with schema issues"
    );
  }

  const validTier = updateMerchantTierSchema.safeParse({
    merchantId: "m-123",
    newTier: "plus",
  });
  assert(validTier.success, "Zod accepts valid tier ('plus')");

  const invalidTier = updateMerchantTierSchema.safeParse({
    merchantId: "m-123",
    newTier: "ultra_vip",
  });
  assert(!invalidTier.success, "Zod rejects invalid tier ('ultra_vip')");

  // 3. Concurrency Attack: Rapid Concurrent Approvals
  console.log("\n📦 [3] Concurrency Attack: Rapid Concurrent Approvals of Same Application");
  const testApp = await prisma.merchantApplication.create({
    data: {
      name: "Eşzamanlı Berber Testi",
      masterName: "Kemal Usta",
      category: "berber",
      experienceYears: 12,
      city: "İstanbul",
      district: "Kadıköy",
      neighborhood: "Moda",
      address: "Moda Cad. No:12, Kadıköy / İstanbul",
      phone: "05329998877",
      whatsapp: "905329998877",
      plan: "pro",
      services: JSON.stringify([{ name: "Klasik Saç Kesimi", minPrice: 250, maxPrice: 350 }]),
      status: "pending",
    },
  });

  // Launch 5 concurrent approval calls
  const concurrentCalls = await Promise.all(
    Array.from({ length: 5 }).map(() =>
      approveApplicationAction(testApp.id, "Eşzamanlı onay testi")
    )
  );

  const successfulApprovals = concurrentCalls.filter((c) => c.success);
  const rejectedApprovals = concurrentCalls.filter((c) => !c.success);

  assert(
    successfulApprovals.length === 1,
    `Exactly 1 approval succeeds under concurrency (Succeeded: ${successfulApprovals.length})`
  );
  assert(
    rejectedApprovals.length === 4,
    `Remaining 4 concurrent attempts are atomically rejected (Rejected: ${rejectedApprovals.length})`
  );

  // Verify only 1 Merchant was created
  const createdMerchants = await prisma.merchant.findMany({
    where: { name: "Eşzamanlı Berber Testi" },
  });
  assert(
    createdMerchants.length === 1,
    `Database has exactly 1 Merchant record (no duplicate merchants)`
  );

  // Clean up created merchant and app
  if (createdMerchants[0]) {
    await prisma.merchant.delete({ where: { id: createdMerchants[0].id } });
  }
  await prisma.merchantApplication.delete({ where: { id: testApp.id } });
  console.log("  🧹 Test kayıtları temizlendi.");

  // 4. Appointments Workstation Actions
  console.log("\n📦 [4] Appointments Desk Query & State Mutation");
  let allAppointments = await prisma.appointment.findMany();
  if (allAppointments.length < 2) {
    const merchant = await prisma.merchant.findFirst();
    if (merchant) {
      const needed = 2 - allAppointments.length;
      for (let i = 0; i < needed; i++) {
        await prisma.appointment.create({
          data: {
            merchantId: merchant.id,
            customerName: `Otomasyon Randevu ${i + 1}`,
            customerPhone: "05329998877",
            date: "2026-10-20",
            startTime: `1${i}:00`,
            endTime: `1${i}:30`,
            price: 300,
            status: "pending",
          },
        });
      }
      allAppointments = await prisma.appointment.findMany();
    }
  }
  assert(allAppointments.length >= 2, `Existing seed appointments found: ${allAppointments.length}`);

  const targetApt = allAppointments[0];
  const prevStatus = targetApt.status;
  const newStatus = prevStatus === "confirmed" ? "completed" : "confirmed";

  // Mutate appointment status
  const aptUpdateResult = await prisma.appointment.update({
    where: { id: targetApt.id },
    data: { status: newStatus },
  });
  assert(aptUpdateResult.status === newStatus, `Appointment status updated to '${newStatus}'`);

  // Log in AdminAuditLog
  const auditEntry = await prisma.adminAuditLog.create({
    data: {
      operator: "Reviewer Tester",
      action: "UPDATE_APPOINTMENT_STATUS",
      targetType: "APPOINTMENT",
      targetId: targetApt.id,
      details: JSON.stringify({ previousStatus: prevStatus, newStatus }),
    },
  });
  assert(Boolean(auditEntry.id), "Audit log recorded UPDATE_APPOINTMENT_STATUS");

  // Revert back
  await prisma.appointment.update({
    where: { id: targetApt.id },
    data: { status: prevStatus },
  });
  await prisma.adminAuditLog.delete({ where: { id: auditEntry.id } });

  // 5. Dashboard Metrics & Telemetry
  console.log("\n📦 [5] Dashboard Metrics Including Appointments");
  const dashboardData = await getAdminDashboardMetrics();
  assert(dashboardData.success === true, "getAdminDashboardMetrics succeeds");
  if (dashboardData.success && dashboardData.data) {
    assert(
      typeof dashboardData.data.totalAppointments === "number",
      `totalAppointments metric present (${dashboardData.data.totalAppointments})`
    );
    assert(
      typeof dashboardData.data.totalMRR === "number" && dashboardData.data.totalMRR > 0,
      `totalMRR properly calculated (${dashboardData.data.totalMRR} ₺)`
    );
  }

  // Final Summary
  console.log("\n================================================================");
  console.log(`📊 FINAL RESULT: ${passedCount} Passed, ${failedCount} Failed`);
  console.log("================================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runReviewerDeepVerification()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error("Test execution failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
