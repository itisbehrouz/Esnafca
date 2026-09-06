"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/auth";
import { SubscriptionTier, Merchant } from "@/types";
import { parseJsonField } from "@/lib/utils";
import {
  approveApplicationSchema,
  rejectApplicationSchema,
  updateMerchantTierSchema,
  moderateReviewSchema,
  sendBroadcastSchema,
  updateAppointmentStatusSchema,
  extendSubscriptionSchema,
  grantGiftMonthSchema,
  refundSubscriptionSchema,
  updateLogisticsStatusSchema,
  updateMerchantDetailsSchema,
  createStaffMemberSchema,
} from "@/lib/admin-schemas";
import { generateAsciiSlug } from "@/lib/slug";

/**
 * Ensures operator has a verified admin session before executing mutation.
 */
async function requireAdmin() {
  const isAdmin = await getAdminSession();
  if (!isAdmin) {
    throw new Error("Yetkisiz işlem: Yönetici oturumu gereklidir.");
  }
  return true;
}

/**
 * 1. Admin Dashboard Overview Metrics
 */
export async function getAdminDashboardMetrics() {
  try {
    await requireAdmin();

    const [merchants, pendingApplications, recentLogs, recentReviews, appointments] =
      await Promise.all([
        prisma.merchant.findMany({
          select: {
            id: true,
            name: true,
            masterName: true,
            category: true,
            city: true,
            district: true,
            tier: true,
            verified: true,
            rating: true,
            reviewCount: true,
            createdAt: true,
          },
        }),
        prisma.merchantApplication.findMany({
          where: { status: "pending" },
          orderBy: { createdAt: "desc" },
        }),
        prisma.adminAuditLog.findMany({
          take: 8,
          orderBy: { createdAt: "desc" },
        }),
        prisma.review.findMany({
          take: 5,
          orderBy: { date: "desc" },
          include: {
            merchant: {
              select: { name: true, slug: true },
            },
          },
        }),
        prisma.appointment.findMany({
          select: { id: true, status: true },
        }),
      ]);

    const tierPrices: Record<string, number> = { free: 0, pro: 390, plus: 890 };
    const totalMRR = merchants.reduce((sum, m) => {
      const tierKey = (m.tier || "free").toLowerCase();
      return sum + (tierPrices[tierKey] || 0);
    }, 0);

    const plusCount = merchants.filter((m) => (m.tier || "").toLowerCase() === "plus").length;
    const proCount = merchants.filter((m) => (m.tier || "").toLowerCase() === "pro").length;
    const freeCount = merchants.filter((m) => (m.tier || "").toLowerCase() === "free").length;
    const verifiedCount = merchants.filter((m) => m.verified).length;
    const pendingAppointmentsCount = appointments.filter((a) => a.status === "pending").length;

    return {
      success: true,
      data: {
        totalMerchants: merchants.length,
        verifiedCount,
        pendingCount: pendingApplications.length,
        totalMRR,
        plusCount,
        proCount,
        freeCount,
        paidSubscribersCount: proCount + plusCount,
        totalAppointments: appointments.length,
        pendingAppointmentsCount,
        pendingApplications,
        recentLogs,
        recentReviews,
      },
    };
  } catch (error: any) {
    console.error("getAdminDashboardMetrics error:", error);
    return { success: false, error: error.message || "Veriler yüklenemedi." };
  }
}

/**
 * 2. Get All Applications (with optional status filter)
 */
export async function getAdminApplications(status = "all") {
  try {
    await requireAdmin();

    const whereClause = status === "all" ? {} : { status };
    const applications = await prisma.merchantApplication.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      data: applications.map((app) => ({
        ...app,
        servicesParsed: parseJsonField(app.services, []),
      })),
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Başvurular alınamadı." };
  }
}

/**
 * 3. Approve Application & Create Merchant Record
 * Concurrency-safe atomic transaction preventing duplicate merchants and race conditions.
 */
export async function approveApplicationAction(appId: string, operatorNotes?: string) {
  try {
    await requireAdmin();

    const validation = approveApplicationSchema.safeParse({
      applicationId: appId,
      operatorNotes,
    });
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message || "Geçersiz parametre." };
    }

    const app = await prisma.merchantApplication.findUnique({
      where: { id: appId },
    });

    if (!app) {
      return { success: false, error: "Başvuru bulunamadı." };
    }

    if (app.status === "approved") {
      return { success: false, error: "Bu başvuru daha önce onaylanmış." };
    }

    // Execute atomic approval transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Atomic status lock check
      const updateResult = await tx.merchantApplication.updateMany({
        where: { id: appId, status: "pending" },
        data: { status: "approved" },
      });

      if (updateResult.count === 0) {
        throw new Error(
          "Bu başvuru onay bekler durumda değil veya başka bir operatör tarafından işleme alındı."
        );
      }

      // 2. Parse services and calculate price boundaries
      const services = parseJsonField(app.services, []);
      const minPrices = services.map((s: any) => Number(s.minPrice) || 100);
      const maxPrices = services.map((s: any) => Number(s.maxPrice) || Number(s.minPrice) || 200);

      const calculatedMin = minPrices.length > 0 ? Math.min(...minPrices) : 100;
      const calculatedMax = maxPrices.length > 0 ? Math.max(...maxPrices) : 500;

      // 3. Generate guaranteed collision-free ASCII slug
      const slugBase = generateAsciiSlug(app.name);
      let candidateSlug = slugBase;
      let counter = 1;

      while (await tx.merchant.findUnique({ where: { slug: candidateSlug } })) {
        candidateSlug = `${slugBase}-${counter++}`;
      }

      const verifiedYear = new Date().getFullYear();

      // 4. Create live merchant
      const newMerchant = await tx.merchant.create({
        data: {
          slug: candidateSlug,
          name: app.name,
          craftTitle: "Mahalle Esnafı & Doğrulanmış Usta",
          masterName: app.masterName,
          category: app.category,
          city: app.city,
          district: app.district,
          neighborhood: app.neighborhood,
          address: app.address,
          latitude: app.latitude,
          longitude: app.longitude,
          phone: app.phone,
          whatsapp: app.whatsapp,
          rating: 5.0,
          reviewCount: 1,
          verified: true,
          verifiedYear,
          tier: app.plan || "pro",
          experienceYears: app.experienceYears || 10,
          minPrice: calculatedMin,
          maxPrice: calculatedMax,
          workingHours: {
            weekdays: "09:00 - 19:30",
            saturday: "09:00 - 19:00",
            sunday: "Kapalı",
          },
          isOpenNow: true,
          heroImage:
            "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80",
          galleryImages: [
            "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80",
          ],
          bio: `${app.neighborhood} bölgesinde hizmet veren doğrulanmış mahalle esnafımız.`,
          specialties: services.map((s: any) => s.name).slice(0, 3),
          features: {
            transparentPricing: true,
            whatsappBooking: true,
            expressOption: true,
            homePickup: false,
          },
          services: {
            create: services.map((s: any, idx: number) => ({
              name: s.name,
              minPrice: Number(s.minPrice) || 100,
              maxPrice: Number(s.maxPrice) || Number(s.minPrice) || 200,
              popular: idx === 0,
            })),
          },
          reviews: {
            create: {
              author: "Mahalleli (İlk Yorum)",
              date: "Yeni Kayıt",
              rating: 5,
              comment: "Yeni katılan mahalle esnafımız. Şeffaf fiyat tarifesi onaylanmıştır.",
              tags: JSON.stringify(["Yeni Esnaf", "Doğrulanmış"]),
            },
          },
        },
      });

      // 5. Create Audit Log inside transaction
      await tx.adminAuditLog.create({
        data: {
          operator: "HQ Operatör",
          action: "APPROVE_APPLICATION",
          targetType: "APPLICATION",
          targetId: appId,
          details: JSON.stringify({
            merchantId: newMerchant.id,
            name: app.name,
            category: app.category,
            plan: app.plan,
            slug: candidateSlug,
            notes: operatorNotes || "Başvuru doğrudan onaylandı ve vitrine alındı.",
          }),
        },
      });

      return { merchantId: newMerchant.id, slug: candidateSlug };
    });

    try {
      revalidatePath("/admin");
      revalidatePath("/admin/applications");
      revalidatePath("/admin/merchants");
      revalidatePath("/admin/audit");
      revalidatePath("/");
    } catch {}

    return { success: true, merchantId: result.merchantId, slug: result.slug };
  } catch (error: any) {
    console.error("approveApplicationAction error:", error);
    return { success: false, error: error.message || "Onaylama başarısız." };
  }
}

/**
 * 4. Reject Application
 * Concurrency-safe atomic check preventing rejection of approved records.
 */
export async function rejectApplicationAction(
  appId: string,
  reason = "Başvuru kriterleri karşılamıyor."
) {
  try {
    await requireAdmin();

    const validation = rejectApplicationSchema.safeParse({
      applicationId: appId,
      reason,
    });
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message || "Geçersiz gerekçe." };
    }

    const app = await prisma.merchantApplication.findUnique({ where: { id: appId } });
    if (!app) return { success: false, error: "Başvuru bulunamadı." };

    const updateResult = await prisma.merchantApplication.updateMany({
      where: { id: appId, status: { not: "approved" } },
      data: { status: "rejected" },
    });

    if (updateResult.count === 0) {
      return { success: false, error: "Onaylanmış bir başvuru reddedilemez." };
    }

    // Create Audit Log
    await prisma.adminAuditLog.create({
      data: {
        operator: "HQ Operatör",
        action: "REJECT_APPLICATION",
        targetType: "APPLICATION",
        targetId: appId,
        details: JSON.stringify({
          name: app.name,
          reason,
        }),
      },
    });

    try {
      revalidatePath("/admin");
      revalidatePath("/admin/applications");
      revalidatePath("/admin/audit");
    } catch {}

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Reddetme başarısız." };
  }
}

/**
 * 5. Get All Merchants
 */
export async function getAdminMerchants() {
  try {
    await requireAdmin();

    const merchants = await prisma.merchant.findMany({
      include: {
        services: true,
        reviews: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      data: merchants.map((m) => ({
        ...m,
        category: m.category as any,
        tier: m.tier as any,
        workingHours: parseJsonField(m.workingHours, {}),
        galleryImages: parseJsonField(m.galleryImages, []),
        specialties: parseJsonField(m.specialties, []),
        features: parseJsonField(m.features, {}),
        reviews: m.reviews.map((r) => ({
          ...r,
          tags: parseJsonField(r.tags, []),
        })),
      })) as unknown as Merchant[],
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Esnaflar alınamadı." };
  }
}

/**
 * 6. Update Merchant Subscription Tier
 */
export async function updateMerchantTierAction(merchantId: string, newTier: SubscriptionTier) {
  try {
    await requireAdmin();

    const validation = updateMerchantTierSchema.safeParse({ merchantId, newTier });
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message || "Geçersiz paket." };
    }

    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { name: true, tier: true },
    });

    if (!merchant) return { success: false, error: "Esnaf bulunamadı." };

    await prisma.merchant.update({
      where: { id: merchantId },
      data: { tier: newTier },
    });

    // Create Audit Log
    await prisma.adminAuditLog.create({
      data: {
        operator: "HQ Operatör",
        action: "UPDATE_TIER",
        targetType: "MERCHANT",
        targetId: merchantId,
        details: JSON.stringify({
          merchantName: merchant.name,
          previousTier: merchant.tier,
          newTier,
        }),
      },
    });

    try {
      revalidatePath("/admin");
      revalidatePath("/admin/merchants");
      revalidatePath("/admin/audit");
      revalidatePath("/");
    } catch {}

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Paket güncellemesi başarısız." };
  }
}

/**
 * 7. Toggle Merchant Verification Status
 */
export async function toggleMerchantVerifiedAction(merchantId: string) {
  try {
    await requireAdmin();

    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { name: true, verified: true },
    });

    if (!merchant) return { success: false, error: "Esnaf bulunamadı." };

    const newStatus = !merchant.verified;

    await prisma.merchant.update({
      where: { id: merchantId },
      data: {
        verified: newStatus,
        verifiedYear: newStatus ? new Date().getFullYear() : null,
      },
    });

    // Create Audit Log
    await prisma.adminAuditLog.create({
      data: {
        operator: "HQ Operatör",
        action: "TOGGLE_VERIFIED",
        targetType: "MERCHANT",
        targetId: merchantId,
        details: JSON.stringify({
          merchantName: merchant.name,
          verified: newStatus,
        }),
      },
    });

    try {
      revalidatePath("/admin");
      revalidatePath("/admin/merchants");
      revalidatePath("/admin/audit");
      revalidatePath("/");
    } catch {}

    return { success: true, verified: newStatus };
  } catch (error: any) {
    return { success: false, error: error.message || "Doğrulama güncellenemedi." };
  }
}

/**
 * 8. Delete Merchant
 */
export async function deleteMerchantAction(merchantId: string) {
  try {
    await requireAdmin();

    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { name: true },
    });

    if (!merchant) return { success: false, error: "Esnaf bulunamadı." };

    await prisma.merchant.delete({
      where: { id: merchantId },
    });

    // Create Audit Log
    await prisma.adminAuditLog.create({
      data: {
        operator: "HQ Operatör",
        action: "DELETE_MERCHANT",
        targetType: "MERCHANT",
        targetId: merchantId,
        details: JSON.stringify({
          deletedMerchantName: merchant.name,
        }),
      },
    });

    try {
      revalidatePath("/admin");
      revalidatePath("/admin/merchants");
      revalidatePath("/admin/audit");
      revalidatePath("/");
    } catch {}

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Esnaf kaydı silinemedi." };
  }
}

/**
 * 9. Get All Customer Reviews (For Moderation Desk)
 */
export async function getAdminReviews() {
  try {
    await requireAdmin();

    const reviews = await prisma.review.findMany({
      include: {
        merchant: {
          select: {
            id: true,
            name: true,
            slug: true,
            category: true,
            city: true,
            district: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    return {
      success: true,
      data: reviews.map((r) => ({
        ...r,
        tags: parseJsonField(r.tags, []),
      })),
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Yorumlar alınamadı." };
  }
}

/**
 * 10. Delete / Moderate Inappropriate Review
 */
export async function deleteReviewAction(
  reviewId: string,
  reason = "Topluluk kurallarına aykırı yorum"
) {
  try {
    await requireAdmin();

    const validation = moderateReviewSchema.safeParse({ reviewId, reason });
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message || "Geçersiz veri." };
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { merchant: true },
    });

    if (!review) return { success: false, error: "Yorum bulunamadı." };

    const merchantId = review.merchantId;

    await prisma.review.delete({
      where: { id: reviewId },
    });

    // Recalculate merchant rating and reviewCount
    const remainingReviews = await prisma.review.findMany({
      where: { merchantId },
      select: { rating: true },
    });

    const newReviewCount = remainingReviews.length;
    const newRating =
      newReviewCount > 0
        ? Number(
            (
              remainingReviews.reduce((sum, r) => sum + r.rating, 0) / newReviewCount
            ).toFixed(1)
          )
        : 5.0;

    await prisma.merchant.update({
      where: { id: merchantId },
      data: {
        reviewCount: newReviewCount,
        rating: newRating,
      },
    });

    // Create Audit Log
    await prisma.adminAuditLog.create({
      data: {
        operator: "HQ Operatör",
        action: "MODERATE_REVIEW",
        targetType: "REVIEW",
        targetId: reviewId,
        details: JSON.stringify({
          merchantName: review.merchant.name,
          author: review.author,
          rating: review.rating,
          commentSnippet: review.comment.slice(0, 80),
          reason,
        }),
      },
    });

    try {
      revalidatePath("/admin/reviews");
      revalidatePath("/admin/audit");
      revalidatePath(`/esnaf/${review.merchant.slug}`);
    } catch {}

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Yorum silinemedi." };
  }
}

/**
 * 11. Send Bulk WhatsApp / SMS Broadcast
 */
export async function sendBroadcastAction(
  target: string,
  message: string,
  channel: "whatsapp" | "sms" = "whatsapp"
) {
  try {
    await requireAdmin();

    const validation = sendBroadcastSchema.safeParse({ target, message, channel });
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message || "Geçersiz duyuru verisi." };
    }

    let targetWhere = {};
    if (target === "pro") {
      targetWhere = { tier: { in: ["pro", "plus"] } };
    } else if (target === "plus") {
      targetWhere = { tier: "plus" };
    } else if (target.startsWith("city:")) {
      targetWhere = { city: target.replace("city:", "") };
    } else if (target.startsWith("district:")) {
      targetWhere = { district: target.replace("district:", "") };
    }

    const recipients = await prisma.merchant.findMany({
      where: targetWhere,
      select: { id: true, name: true, phone: true, whatsapp: true },
    });

    // Create Audit Log
    await prisma.adminAuditLog.create({
      data: {
        operator: "HQ Operatör",
        action: "BROADCAST_SENT",
        targetType: "BROADCAST",
        targetId: `broadcast-${Date.now()}`,
        details: JSON.stringify({
          targetGroup: target,
          recipientCount: recipients.length,
          channel,
          messageSnippet: message.slice(0, 100),
        }),
      },
    });

    try {
      revalidatePath("/admin/broadcast");
      revalidatePath("/admin/audit");
    } catch {}

    return {
      success: true,
      recipientCount: recipients.length,
      sampleRecipients: recipients.slice(0, 5),
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Toplu duyuru gönderilemedi." };
  }
}

/**
 * 12. Get Operator Audit Logs
 */
export async function getAdminAuditLogs(limit = 100) {
  try {
    await requireAdmin();

    const logs = await prisma.adminAuditLog.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      data: logs.map((log) => ({
        ...log,
        detailsParsed: parseJsonField(log.details, {}),
      })),
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Denetim kütüğü alınamadı." };
  }
}

/**
 * 13. Get Real-time Admin Notifications
 */
export async function getAdminNotifications() {
  try {
    await requireAdmin();

    const [totalPendingCount, pendingApps, recentReviews, recentLogs] = await Promise.all([
      prisma.merchantApplication.count({ where: { status: "pending" } }),
      prisma.merchantApplication.findMany({
        where: { status: "pending" },
        take: 5,
        orderBy: { createdAt: "desc" },
      }),
      prisma.review.findMany({
        take: 5,
        orderBy: { date: "desc" },
        include: { merchant: { select: { name: true } } },
      }),
      prisma.adminAuditLog.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const notifications = [
      ...pendingApps.map((a) => ({
        id: `app-${a.id}`,
        category: "APPLICATION",
        title: "Yeni Esnaf Başvurusu",
        message: `${a.name} (${a.masterName}) - ${a.city}/${a.district}`,
        targetUrl: "/admin/applications",
        createdAt: a.createdAt.toISOString(),
        severity: "WARNING",
      })),
      ...recentReviews.map((r) => ({
        id: `rev-${r.id}`,
        category: "REVIEW",
        title: "Yeni Müşteri Değerlendirmesi",
        message: `${r.merchant.name} için ${r.rating} yıldızlı yorum: "${r.comment.slice(0, 45)}..."`,
        targetUrl: "/admin/reviews",
        createdAt: new Date().toISOString(),
        severity: "INFO",
      })),
      ...recentLogs.map((l) => ({
        id: `log-${l.id}`,
        category: "SECURITY",
        title: "Operatör İşlemi",
        message: `${l.operator}: ${l.action}`,
        targetUrl: "/admin/audit",
        createdAt: l.createdAt.toISOString(),
        severity: "SUCCESS",
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
      success: true,
      data: notifications,
      pendingApplicationsCount: totalPendingCount,
      unreadCount: totalPendingCount,
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Bildirimler yüklenemedi." };
  }
}

/**
 * 13b. Get Exact Pending Applications Count for Sidebar
 */
export async function getPendingApplicationsCount() {
  try {
    await requireAdmin();
    const count = await prisma.merchantApplication.count({
      where: { status: "pending" },
    });
    return { success: true, count };
  } catch (error: any) {
    return { success: false, count: 0, error: error.message };
  }
}

/**
 * 14. Get All Appointments (For Appointments Desk)
 */
export async function getAdminAppointments(status = "all") {
  try {
    await requireAdmin();

    const whereClause = status === "all" ? {} : { status };
    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        merchant: {
          select: {
            id: true,
            name: true,
            masterName: true,
            phone: true,
            whatsapp: true,
            city: true,
            district: true,
            slug: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            minPrice: true,
            maxPrice: true,
          },
        },
      },
      orderBy: [{ date: "desc" }, { startTime: "desc" }],
    });

    return {
      success: true,
      data: appointments,
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Randevular yüklenemedi." };
  }
}

/**
 * 15. Update Appointment Status
 */
export async function updateAppointmentStatusAction(
  appointmentId: string,
  newStatus: "pending" | "confirmed" | "completed" | "cancelled"
) {
  try {
    await requireAdmin();

    const validation = updateAppointmentStatusSchema.safeParse({
      appointmentId,
      status: newStatus,
    });
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message || "Geçersiz randevu durumu." };
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { merchant: { select: { name: true } } },
    });

    if (!appointment) {
      return { success: false, error: "Randevu bulunamadı." };
    }

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: newStatus },
    });

    // Create Audit Log
    await prisma.adminAuditLog.create({
      data: {
        operator: "HQ Operatör",
        action: "UPDATE_APPOINTMENT_STATUS",
        targetType: "APPOINTMENT",
        targetId: appointmentId,
        details: JSON.stringify({
          merchantName: appointment.merchant.name,
          customerName: appointment.customerName,
          date: appointment.date,
          startTime: appointment.startTime,
          previousStatus: appointment.status,
          newStatus,
        }),
      },
    });

    try {
      revalidatePath("/admin");
      revalidatePath("/admin/appointments");
      revalidatePath("/admin/audit");
    } catch {}

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Randevu durumu güncellenemedi." };
  }
}

/**
 * 16. Get Finance & Subscription Desk Metrics
 */
export async function getAdminFinanceMetrics() {
  try {
    await requireAdmin();

    const [merchants, subscriptions, payments, recentLogs] = await Promise.all([
      prisma.merchant.findMany({
        where: { tier: { in: ["pro", "plus"] } },
        select: {
          id: true,
          name: true,
          masterName: true,
          tier: true,
          city: true,
          district: true,
          phone: true,
          slug: true,
          createdAt: true,
        },
      }),
      prisma.subscription.findMany({
        include: {
          merchant: {
            select: { id: true, name: true, masterName: true, tier: true, phone: true, city: true, district: true },
          },
        },
        orderBy: { nextRenewalDate: "asc" },
      }),
      prisma.paymentTransaction.findMany({
        include: {
          merchant: {
            select: { id: true, name: true, tier: true, slug: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.adminAuditLog.findMany({
        where: {
          action: {
            in: ["EXTEND_SUBSCRIPTION", "GRANT_GIFT_MONTH", "REFUND_PAYMENT", "RETRY_PAYMENT", "UPDATE_TIER"],
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    const proCount = merchants.filter((m) => m.tier === "pro").length;
    const plusCount = merchants.filter((m) => m.tier === "plus").length;

    // Monthly Recurring Revenue calculation:
    // Support active Pro (390₺ / 750₺) and Plus (890₺) recurring subscriptions.
    // Sum active subscriptions; fallback to merchant tier if merchant has no subscription record yet.
    const activeSubs = subscriptions.filter((s) => s.status === "active");
    const subMerchantIds = new Set(activeSubs.map((s) => s.merchantId));

    let calculatedMRR = 0;
    for (const sub of activeSubs) {
      if (sub.billingInterval === "annual") {
        calculatedMRR += Math.round(sub.price / 12);
      } else {
        calculatedMRR += sub.price;
      }
    }

    for (const m of merchants) {
      if (!subMerchantIds.has(m.id)) {
        calculatedMRR += m.tier === "plus" ? 890 : 390;
      }
    }

    const calculatedARR = calculatedMRR * 12;

    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const renewingIn7Days = subscriptions.filter(
      (s) => new Date(s.nextRenewalDate) <= in7Days && s.status === "active"
    ).length;
    const renewingIn30Days = subscriptions.filter(
      (s) => new Date(s.nextRenewalDate) <= in30Days && s.status === "active"
    ).length;

    const successfulPayments = payments.filter((p) => p.status === "SUCCESS").length;
    const failedPayments = payments.filter((p) => p.status === "FAILED");
    const refundedPayments = payments.filter((p) => p.status === "REFUNDED").length;

    const totalTrackedPayments = payments.length;
    const successRate = totalTrackedPayments > 0
      ? Number(((successfulPayments / totalTrackedPayments) * 100).toFixed(1))
      : 100;

    return {
      success: true,
      data: {
        totalMRR: calculatedMRR,
        totalARR: calculatedARR,
        activePaidCount: proCount + plusCount,
        proCount,
        plusCount,
        renewingIn7Days,
        renewingIn30Days,
        successRate,
        subscriptions,
        payments,
        failedPayments,
        refundedCount: refundedPayments,
        recentFinanceLogs: recentLogs,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Finans verileri yüklenemedi." };
  }
}

/**
 * 17. Extend Subscription Tier
 */
export async function extendSubscriptionAction(
  merchantId: string,
  additionalMonths: number,
  reason = "Operatör tarafından manuel abonelik uzatımı"
) {
  try {
    await requireAdmin();

    const validation = extendSubscriptionSchema.safeParse({
      merchantId,
      months: additionalMonths,
      reason,
    });
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message || "Geçersiz parametre." };
    }

    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      include: { subscriptions: { orderBy: { currentPeriodEnd: "desc" }, take: 1 } },
    });

    if (!merchant) {
      return { success: false, error: "Esnaf bulunamadı." };
    }

    const existingSub = merchant.subscriptions[0];
    const now = new Date();
    // If existing end date is in the future, extend from that date; if expired or missing, extend from now!
    const baseDate =
      existingSub?.currentPeriodEnd && new Date(existingSub.currentPeriodEnd) > now
        ? new Date(existingSub.currentPeriodEnd)
        : new Date(now);
    const newPeriodEnd = new Date(baseDate.setMonth(baseDate.getMonth() + additionalMonths));

    if (existingSub) {
      await prisma.subscription.update({
        where: { id: existingSub.id },
        data: {
          currentPeriodEnd: newPeriodEnd,
          nextRenewalDate: newPeriodEnd,
          status: "active",
        },
      });
    } else {
      await prisma.subscription.create({
        data: {
          merchantId,
          tier: merchant.tier === "free" ? "pro" : (merchant.tier || "pro"),
          price: merchant.tier === "plus" ? 890 : 390,
          status: "active",
          billingInterval: "monthly",
          currentPeriodEnd: newPeriodEnd,
          nextRenewalDate: newPeriodEnd,
        },
      });
    }

    // If merchant was free, upgrade to pro with verification
    if (merchant.tier === "free") {
      await prisma.merchant.update({
        where: { id: merchantId },
        data: { tier: "pro", verified: true, verifiedYear: new Date().getFullYear() },
      });
    }

    // Log to AdminAuditLog
    await prisma.adminAuditLog.create({
      data: {
        operator: "HQ Finans Masası",
        action: "EXTEND_SUBSCRIPTION",
        targetType: "MERCHANT",
        targetId: merchantId,
        details: JSON.stringify({
          merchantName: merchant.name,
          additionalMonths,
          newPeriodEnd: newPeriodEnd.toISOString(),
          reason,
        }),
      },
    });

    try {
      revalidatePath("/admin/finance");
      revalidatePath("/admin/merchants");
      revalidatePath("/admin/audit");
    } catch {}

    return { success: true, newPeriodEnd: newPeriodEnd.toISOString() };
  } catch (error: any) {
    return { success: false, error: error.message || "Abonelik süresi uzatılamadı." };
  }
}

/**
 * 18. Grant Gift Month
 */
export async function grantGiftMonthAction(
  merchantId: string,
  giftMonths: number,
  reason: string
) {
  try {
    await requireAdmin();

    const validation = grantGiftMonthSchema.safeParse({
      merchantId,
      months: giftMonths,
      reason,
    });
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message || "Geçersiz parametre." };
    }

    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      include: { subscriptions: { orderBy: { currentPeriodEnd: "desc" }, take: 1 } },
    });

    if (!merchant) {
      return { success: false, error: "Esnaf bulunamadı." };
    }

    const existingSub = merchant.subscriptions[0];
    const now = new Date();
    // If existing end date is in the future, extend from that date; if expired or missing, extend from now!
    const baseDate =
      existingSub?.currentPeriodEnd && new Date(existingSub.currentPeriodEnd) > now
        ? new Date(existingSub.currentPeriodEnd)
        : new Date(now);
    const newPeriodEnd = new Date(baseDate.setMonth(baseDate.getMonth() + giftMonths));

    if (existingSub) {
      await prisma.subscription.update({
        where: { id: existingSub.id },
        data: {
          currentPeriodEnd: newPeriodEnd,
          nextRenewalDate: newPeriodEnd,
          status: "active",
        },
      });
    } else {
      await prisma.subscription.create({
        data: {
          merchantId,
          tier: merchant.tier === "free" ? "pro" : merchant.tier,
          price: merchant.tier === "plus" ? 890 : 390,
          status: "active",
          billingInterval: "monthly",
          currentPeriodEnd: newPeriodEnd,
          nextRenewalDate: newPeriodEnd,
        },
      });
      // If was free, upgrade to pro
      if (merchant.tier === "free") {
        await prisma.merchant.update({
          where: { id: merchantId },
          data: { tier: "pro", verified: true, verifiedYear: new Date().getFullYear() },
        });
      }
    }

    // Log to AdminAuditLog
    await prisma.adminAuditLog.create({
      data: {
        operator: "HQ Finans Masası",
        action: "GRANT_GIFT_MONTH",
        targetType: "MERCHANT",
        targetId: merchantId,
        details: JSON.stringify({
          merchantName: merchant.name,
          giftMonths,
          reason,
          newPeriodEnd: newPeriodEnd.toISOString(),
        }),
      },
    });

    try {
      revalidatePath("/admin/finance");
      revalidatePath("/admin/merchants");
      revalidatePath("/admin/audit");
    } catch {}

    return { success: true, newPeriodEnd: newPeriodEnd.toISOString() };
  } catch (error: any) {
    return { success: false, error: error.message || "Hediye ay tanımlanamadı." };
  }
}

/**
 * 19. Refund Payment Action
 */
export async function refundSubscriptionAction(paymentId: string, reason: string) {
  try {
    await requireAdmin();

    const validation = refundSubscriptionSchema.safeParse({ paymentId, reason });
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message || "Geçersiz parametre." };
    }

    const tx = await prisma.paymentTransaction.findUnique({
      where: { paymentId },
      include: { merchant: true },
    });

    if (!tx) {
      return { success: false, error: "Ödeme işlemi bulunamadı." };
    }

    if (tx.status === "REFUNDED") {
      return { success: false, error: "Bu ödeme zaten daha önce iade edilmiş." };
    }

    await prisma.paymentTransaction.update({
      where: { paymentId },
      data: {
        status: "REFUNDED",
        refundReason: reason,
        refundedAt: new Date(),
      },
    });

    // If payment was for a merchant's subscription, cancel active subscriptions
    if (tx.merchantId) {
      await prisma.subscription.updateMany({
        where: { merchantId: tx.merchantId, status: "active" },
        data: { status: "cancelled", cancelAtPeriodEnd: true },
      });
    }

    // Record audit log
    await prisma.adminAuditLog.create({
      data: {
        operator: "HQ Finans Masası",
        action: "REFUND_PAYMENT",
        targetType: "PAYMENT",
        targetId: paymentId,
        details: JSON.stringify({
          amount: tx.amount,
          currency: tx.currency,
          merchantId: tx.merchantId,
          merchantName: tx.merchant?.name,
          reason,
          cancelledActiveSubscriptions: Boolean(tx.merchantId),
        }),
      },
    });

    try {
      revalidatePath("/admin/finance");
      revalidatePath("/admin/audit");
    } catch {}

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Ödeme iade edilemedi." };
  }
}

/**
 * 20. Retry Failed Payment Action
 */
export async function retryFailedPaymentAction(paymentId: string) {
  try {
    await requireAdmin();

    const tx = await prisma.paymentTransaction.findUnique({
      where: { paymentId },
      include: { merchant: true },
    });

    if (!tx) {
      return { success: false, error: "Ödeme kaydı bulunamadı." };
    }

    // Simulate recovery attempt
    await prisma.paymentTransaction.update({
      where: { paymentId },
      data: {
        status: "SUCCESS",
        failureReason: null,
        payload: JSON.stringify({
          recoveredAt: new Date().toISOString(),
          recoveredBy: "HQ Operatör",
          previousStatus: "FAILED",
        }),
      },
    });

    // If merchant had a subscription in past_due status, restore to active
    if (tx.merchantId) {
      await prisma.subscription.updateMany({
        where: { merchantId: tx.merchantId, status: "past_due" },
        data: { status: "active" },
      });
    }

    // Log to AdminAuditLog
    await prisma.adminAuditLog.create({
      data: {
        operator: "HQ Finans Masası",
        action: "RETRY_PAYMENT",
        targetType: "PAYMENT",
        targetId: paymentId,
        details: JSON.stringify({
          merchantName: tx.merchant?.name,
          amount: tx.amount,
          resolved: true,
          restoredSubscription: Boolean(tx.merchantId),
        }),
      },
    });

    try {
      revalidatePath("/admin/finance");
      revalidatePath("/admin/audit");
    } catch {}

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Ödeme yeniden denenemedi." };
  }
}

/**
 * 21. Get Merchant In-Depth Details (Phase 2)
 */
export async function getAdminMerchantDetails(merchantId: string) {
  try {
    await requireAdmin();

    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      include: {
        services: {
          orderBy: { minPrice: "asc" },
        },
        reviews: {
          orderBy: { date: "desc" },
        },
        appointments: {
          take: 10,
          orderBy: { date: "desc" },
        },
        subscriptions: {
          orderBy: { createdAt: "desc" },
        },
        shipments: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!merchant) {
      return { success: false, error: "Esnaf bulunamadı." };
    }

    return {
      success: true,
      data: {
        ...merchant,
        workingHours: parseJsonField(merchant.workingHours, {
          weekdays: "09:00 - 19:30",
          saturday: "09:00 - 19:00",
          sunday: "Kapalı",
        }),
        galleryImages: parseJsonField(merchant.galleryImages, []),
        specialties: parseJsonField(merchant.specialties, []),
        features: parseJsonField(merchant.features, {}),
        reviews: merchant.reviews.map((r) => ({
          ...r,
          tags: parseJsonField(r.tags, []),
        })),
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Esnaf detayları yüklenemedi." };
  }
}

/**
 * 22. Update Merchant In-Depth Details & Service Items CRUD (Phase 2)
 */
export async function updateMerchantDetailsAction(merchantId: string, payload: any) {
  try {
    await requireAdmin();

    const validation = updateMerchantDetailsSchema.safeParse(payload);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message || "Geçersiz esnaf verisi." };
    }

    const data = validation.data;

    const existing = await prisma.merchant.findUnique({
      where: { id: merchantId },
      include: { services: true },
    });

    if (!existing) {
      return { success: false, error: "Esnaf bulunamadı." };
    }

    // Execute atomic transaction for merchant and service item updates
    await prisma.$transaction(async (tx) => {
      // 1. Calculate price boundary from services
      const minPrices = (data.services || []).map((s) => s.minPrice);
      const maxPrices = (data.services || []).map((s) => Math.max(s.minPrice, s.maxPrice ?? s.minPrice));

      const calculatedMin = minPrices.length > 0 ? Math.min(...minPrices) : 0;
      const calculatedMax = maxPrices.length > 0 ? Math.max(...maxPrices) : calculatedMin;

      // 2. Update merchant record
      await tx.merchant.update({
        where: { id: merchantId },
        data: {
          name: data.name,
          masterName: data.masterName,
          craftTitle: data.craftTitle,
          category: data.category,
          bio: data.bio || "",
          experienceYears: data.experienceYears,
          phone: data.phone,
          whatsapp: data.whatsapp,
          city: data.city,
          district: data.district,
          neighborhood: data.neighborhood,
          address: data.address,
          latitude: data.latitude,
          longitude: data.longitude,
          isOpenNow: data.isOpenNow,
          heroImage: data.heroImage,
          galleryImages: data.galleryImages || [],
          workingHours: data.workingHours || existing.workingHours,
          minPrice: calculatedMin,
          maxPrice: calculatedMax,
        },
      });

      // 3. Service Items CRUD
      const incomingServices = data.services || [];
      const incomingServiceIds = incomingServices.filter((s) => s.id).map((s) => s.id as string);

      // Delete removed services
      const servicesToDelete = existing.services.filter((s) => !incomingServiceIds.includes(s.id));
      if (servicesToDelete.length > 0) {
        await tx.serviceItem.deleteMany({
          where: { id: { in: servicesToDelete.map((s) => s.id) } },
        });
      }

      // Upsert incoming services
      for (const s of incomingServices) {
        const normalizedMax = Math.max(s.minPrice, s.maxPrice ?? s.minPrice);
        if (s.id && existing.services.some((ex) => ex.id === s.id)) {
          // Update existing
          await tx.serviceItem.update({
            where: { id: s.id },
            data: {
              name: s.name,
              minPrice: s.minPrice,
              maxPrice: normalizedMax,
              popular: Boolean(s.popular),
              estimatedDuration: s.estimatedDuration,
            },
          });
        } else {
          // Create new service
          await tx.serviceItem.create({
            data: {
              merchantId,
              name: s.name,
              minPrice: s.minPrice,
              maxPrice: normalizedMax,
              popular: Boolean(s.popular),
              estimatedDuration: s.estimatedDuration,
            },
          });
        }
      }

      // 4. Record Audit Log
      await tx.adminAuditLog.create({
        data: {
          operator: "HQ Operatör",
          action: "UPDATE_MERCHANT_DETAILS",
          targetType: "MERCHANT",
          targetId: merchantId,
          details: JSON.stringify({
            merchantName: data.name,
            updatedFields: Object.keys(data),
            servicesCount: incomingServices.length,
          }),
        },
      });
    });

    try {
      revalidatePath("/admin");
      revalidatePath("/admin/merchants");
      revalidatePath(`/admin/merchants/${merchantId}`);
      revalidatePath(`/esnaf/${existing.slug}`);
      revalidatePath("/");
    } catch {}

    return { success: true };
  } catch (error: any) {
    console.error("updateMerchantDetailsAction error:", error);
    return { success: false, error: error.message || "Esnaf bilgileri güncellenemedi." };
  }
}

/**
 * 23. Get Logistics & QR Stand Desk Data (Phase 3)
 */
export async function getAdminLogisticsData() {
  try {
    await requireAdmin();

    const [shipments, proAndPlusMerchants] = await Promise.all([
      prisma.standShipment.findMany({
        include: {
          merchant: {
            select: { id: true, name: true, masterName: true, tier: true, phone: true, city: true, district: true, slug: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.merchant.findMany({
        where: { tier: { in: ["pro", "plus"] }, verified: true },
        select: {
          id: true,
          name: true,
          masterName: true,
          tier: true,
          phone: true,
          address: true,
          city: true,
          district: true,
          neighborhood: true,
          slug: true,
        },
      }),
    ]);

    const pendingPrintCount = shipments.filter((s) => s.status === "PENDING_PRINT").length;
    const printingCount = shipments.filter((s) => s.status === "PRINTING").length;
    const shippedCount = shipments.filter((s) => s.status === "SHIPPED").length;
    const deliveredCount = shipments.filter((s) => s.status === "DELIVERED").length;

    // Merchants that don't have a stand shipment yet
    const shippedMerchantIds = new Set(shipments.map((s) => s.merchantId));
    const eligibleWithoutStand = proAndPlusMerchants.filter((m) => !shippedMerchantIds.has(m.id));

    return {
      success: true,
      data: {
        shipments,
        eligibleWithoutStand,
        metrics: {
          totalShipments: shipments.length,
          pendingPrintCount,
          printingCount,
          shippedCount,
          deliveredCount,
        },
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Lojistik verileri yüklenemedi." };
  }
}

/**
 * 24. Update Logistics Shipment Status (Phase 3)
 */
export async function updateLogisticsStatusAction(
  shipmentId: string,
  newStatus: "PENDING_PRINT" | "PRINTING" | "SHIPPED" | "DELIVERED" | "CANCELLED",
  carrier?: string,
  trackingNumber?: string,
  notes?: string
) {
  try {
    await requireAdmin();

    const validation = updateLogisticsStatusSchema.safeParse({
      shipmentId,
      status: newStatus,
      carrier,
      trackingNumber,
      notes,
    });
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message || "Geçersiz lojistik verisi." };
    }

    const existing = await prisma.standShipment.findUnique({
      where: { id: shipmentId },
      include: { merchant: true },
    });

    if (!existing) {
      return { success: false, error: "Sevkiyat kaydı bulunamadı." };
    }

    const dataToUpdate: any = {
      status: newStatus,
      notes: notes !== undefined ? notes : existing.notes,
    };

    if (carrier) dataToUpdate.carrier = carrier;
    if (trackingNumber) dataToUpdate.trackingNumber = trackingNumber;

    if (newStatus === "SHIPPED" && !existing.shippedAt) {
      dataToUpdate.shippedAt = new Date();
    }
    if (newStatus === "DELIVERED" && !existing.deliveredAt) {
      dataToUpdate.deliveredAt = new Date();
    }

    await prisma.standShipment.update({
      where: { id: shipmentId },
      data: dataToUpdate,
    });

    // Audit Log
    await prisma.adminAuditLog.create({
      data: {
        operator: "HQ Lojistik Masası",
        action: "UPDATE_LOGISTICS_STATUS",
        targetType: "LOGISTICS",
        targetId: shipmentId,
        details: JSON.stringify({
          merchantName: existing.merchant.name,
          previousStatus: existing.status,
          newStatus,
          carrier: carrier || existing.carrier,
          trackingNumber: trackingNumber || existing.trackingNumber,
        }),
      },
    });

    try {
      revalidatePath("/admin/logistics");
      revalidatePath("/admin/audit");
    } catch {}

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Lojistik durumu güncellenemedi." };
  }
}

/**
 * 25. Create New Stand Shipment Order (Phase 3)
 */
export async function createStandShipmentAction(
  merchantId: string,
  recipientName: string,
  recipientPhone: string,
  shippingAddress: string,
  notes?: string
) {
  try {
    await requireAdmin();

    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
    });

    if (!merchant) {
      return { success: false, error: "Esnaf bulunamadı." };
    }

    const shipment = await prisma.standShipment.create({
      data: {
        merchantId,
        status: "PENDING_PRINT",
        recipientName: recipientName || merchant.masterName || merchant.name,
        recipientPhone: recipientPhone || merchant.phone,
        shippingAddress: shippingAddress || `${merchant.address}, ${merchant.district} / ${merchant.city}`,
        notes: notes || "Pleksi stand & vitrin QR kiti talebi",
        qrPayloadUrl: `https://esnafca.com/esnaf/${merchant.slug}`,
      },
    });

    await prisma.adminAuditLog.create({
      data: {
        operator: "HQ Lojistik Masası",
        action: "CREATE_STAND_SHIPMENT",
        targetType: "LOGISTICS",
        targetId: shipment.id,
        details: JSON.stringify({
          merchantName: merchant.name,
          recipientName,
        }),
      },
    });

    try {
      revalidatePath("/admin/logistics");
      revalidatePath("/admin/audit");
    } catch {}

    return { success: true, shipmentId: shipment.id };
  } catch (error: any) {
    return { success: false, error: error.message || "Stand sevkiyat talebi oluşturulamadı." };
  }
}

/**
 * 26. Get Staff Desk Data (Phase 4)
 */
export async function getAdminStaffData() {
  try {
    await requireAdmin();

    const [staffMembers, recentLogs, pendingAppsCount, pendingShipmentsCount, failedPaymentsCount, pendingReviewsCount] =
      await Promise.all([
        prisma.staffMember.findMany({
          orderBy: [{ role: "asc" }, { name: "asc" }],
        }),
        prisma.adminAuditLog.findMany({
          orderBy: { createdAt: "desc" },
          take: 30,
        }),
        prisma.merchantApplication.count({
          where: { status: "pending" },
        }),
        prisma.standShipment.count({
          where: { status: { in: ["PENDING_PRINT", "PRINTING"] } },
        }),
        prisma.paymentTransaction.count({
          where: { status: "FAILED" },
        }),
        prisma.review.count({
          where: { verifiedCustomer: false },
        }),
      ]);

    // Role distribution stats
    const superAdminCount = staffMembers.filter((s) => s.role === "SUPER_ADMIN").length;
    const operatorCount = staffMembers.filter((s) => s.role === "OPERATOR").length;
    const complianceCount = staffMembers.filter((s) => s.role === "COMPLIANCE").length;

    return {
      success: true,
      data: {
        staffMembers,
        recentLogs,
        stats: {
          totalStaff: staffMembers.length,
          superAdminCount,
          operatorCount,
          complianceCount,
        },
        assignedQueues: {
          pendingApplications: pendingAppsCount,
          pendingPrintShipments: pendingShipmentsCount,
          failedPayments: failedPaymentsCount,
          pendingReviews: pendingReviewsCount,
        },
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Personel listesi yüklenemedi." };
  }
}

/**
 * 27. Create Staff Member (Phase 4)
 */
export async function createStaffMemberAction(data: {
  name: string;
  email: string;
  phone?: string;
  role: "SUPER_ADMIN" | "OPERATOR" | "COMPLIANCE";
  title: string;
}) {
  try {
    await requireAdmin();

    const validation = createStaffMemberSchema.safeParse(data);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message || "Geçersiz personel verisi." };
    }

    const existing = await prisma.staffMember.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      return { success: false, error: "Bu e-posta adresiyle kayıtlı bir personel zaten var." };
    }

    const member = await prisma.staffMember.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        title: data.title,
        status: "ACTIVE",
      },
    });

    await prisma.adminAuditLog.create({
      data: {
        operator: "HQ Personel Masası",
        action: "CREATE_STAFF_MEMBER",
        targetType: "STAFF",
        targetId: member.id,
        details: JSON.stringify({
          name: member.name,
          email: member.email,
          role: member.role,
        }),
      },
    });

    try {
      revalidatePath("/admin/staff");
      revalidatePath("/admin/audit");
    } catch {}

    return { success: true, memberId: member.id };
  } catch (error: any) {
    return { success: false, error: error.message || "Personel oluşturulamadı." };
  }
}

/**
 * 28. Update Staff Member Status (Phase 4)
 */
export async function updateStaffMemberStatusAction(staffId: string, status: "ACTIVE" | "ON_LEAVE" | "INACTIVE") {
  try {
    await requireAdmin();

    const member = await prisma.staffMember.findUnique({
      where: { id: staffId },
    });

    if (!member) {
      return { success: false, error: "Personel bulunamadı." };
    }

    await prisma.staffMember.update({
      where: { id: staffId },
      data: { status, lastActiveAt: new Date() },
    });

    await prisma.adminAuditLog.create({
      data: {
        operator: "HQ Personel Masası",
        action: "UPDATE_STAFF_STATUS",
        targetType: "STAFF",
        targetId: staffId,
        details: JSON.stringify({
          name: member.name,
          newStatus: status,
        }),
      },
    });

    try {
      revalidatePath("/admin/staff");
      revalidatePath("/admin/audit");
    } catch {}

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Personel durumu güncellenemedi." };
  }
}

/**
 * 29. Get Territory & Merchant Density Coverage Data (Phase 5)
 */
export async function getAdminMapCoverageData() {
  try {
    await requireAdmin();

    const merchants = await prisma.merchant.findMany({
      select: {
        id: true,
        name: true,
        masterName: true,
        category: true,
        city: true,
        district: true,
        neighborhood: true,
        address: true,
        latitude: true,
        longitude: true,
        phone: true,
        rating: true,
        reviewCount: true,
        tier: true,
        verified: true,
        slug: true,
      },
    });

    // Group merchants by district
    const districtStats: Record<
      string,
      {
        total: number;
        categories: Record<string, number>;
        verifiedCount: number;
        paidCount: number;
      }
    > = {};

    const targetCategories = ["berber", "terzi", "cilingir", "oto-tamir", "veteriner", "lostra"];

    for (const m of merchants) {
      const dist = m.district || "Bilinmiyor";
      if (!districtStats[dist]) {
        districtStats[dist] = {
          total: 0,
          categories: {},
          verifiedCount: 0,
          paidCount: 0,
        };
      }
      districtStats[dist].total++;
      if (m.verified) districtStats[dist].verifiedCount++;
      if (m.tier === "pro" || m.tier === "plus") districtStats[dist].paidCount++;

      const cat = m.category.toLowerCase();
      districtStats[dist].categories[cat] = (districtStats[dist].categories[cat] || 0) + 1;
    }

    // Detect Supply Gaps in key districts (e.g. Kadıköy, Beşiktaş, Şişli, Kağıthane)
    const monitoredDistricts = ["Kadıköy", "Beşiktaş", "Kağıthane", "Şişli", "Bakırköy", "Üsküdar", "Beyoğlu"];
    const supplyGaps: Array<{
      district: string;
      category: string;
      currentCount: number;
      recommendation: string;
      severity: "HIGH" | "MEDIUM" | "LOW";
    }> = [];

    for (const dist of monitoredDistricts) {
      const stats = districtStats[dist];
      for (const cat of targetCategories) {
        const count = stats?.categories[cat] || 0;
        if (count === 0) {
          supplyGaps.push({
            district: dist,
            category: cat,
            currentCount: 0,
            recommendation: `${dist} bölgesinde hiç ${cat.toUpperCase()} esnafı yok. Saha ekibi yönlendirilmeli.`,
            severity: "HIGH",
          });
        } else if (count === 1) {
          supplyGaps.push({
            district: dist,
            category: cat,
            currentCount: 1,
            recommendation: `${dist} bölgesinde yalnızca 1 ${cat.toUpperCase()} esnafı var. Alternatif usta kaydı açılmalı.`,
            severity: "MEDIUM",
          });
        }
      }
    }

    return {
      success: true,
      data: {
        merchants,
        districtStats,
        supplyGaps,
        totalMappedMerchants: merchants.filter((m) => m.latitude && m.longitude).length,
        totalMerchants: merchants.length,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Harita kapsama verileri yüklenemedi." };
  }
}

