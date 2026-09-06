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

    const [pendingApps, recentReviews, recentLogs] = await Promise.all([
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
      unreadCount: pendingApps.length,
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Bildirimler yüklenemedi." };
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
