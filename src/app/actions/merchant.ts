"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { 
  getAdminSession, 
  getMerchantSession, 
  signMerchantToken, 
  signAdminToken, 
  checkAdminPassword 
} from "@/lib/auth";
import { generateOtp, verifyOtpCode } from "@/lib/otp";
import { parseJsonField, normalizeToTenDigits } from "@/lib/utils";
import { Merchant } from "@/types";

/**
 * esnaf-ekle (New Merchant Application)
 */
export async function submitApplication(data: {
  name: string;
  masterName: string;
  category: string;
  experienceYears?: number;
  city: string;
  district: string;
  neighborhood: string;
  address: string;
  latitude?: number;
  longitude?: number;
  phone: string;
  whatsapp: string;
  plan: string;
  services: any[];
}) {
  try {
    const newApp = await prisma.merchantApplication.create({
      data: {
        name: data.name,
        masterName: data.masterName,
        category: data.category,
        experienceYears: data.experienceYears,
        city: data.city,
        district: data.district,
        neighborhood: data.neighborhood,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        phone: data.phone,
        whatsapp: data.whatsapp,
        plan: data.plan,
        services: JSON.stringify(data.services),
        status: "pending",
      },
    });
    try {
      revalidatePath("/admin");
    } catch {}
    return { success: true, applicationId: newApp.id };
  } catch (error) {
    console.error("Error submitting application:", error);
    return { success: false, error: "Veritabanı hatası oluştu." };
  }
}

/**
 * admin (Get Pending Applications) - Protected
 */
export async function getPendingApplications() {
  try {
    const isAdmin = await getAdminSession();
    if (!isAdmin) {
      console.warn("Unauthorized attempt to getPendingApplications");
      return [];
    }

    return await prisma.merchantApplication.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error fetching applications:", error);
    return [];
  }
}

/**
 * admin (Approve Application) - Protected
 */
export async function approveApplication(appId: string) {
  try {
    const isAdmin = await getAdminSession();
    if (!isAdmin) {
      return { success: false, error: "Yetkisiz işlem. Yönetici girişi gereklidir." };
    }

    const app = await prisma.merchantApplication.findUnique({
      where: { id: appId },
    });

    if (!app) return { success: false, error: "Başvuru bulunamadı." };

    let services = [];
    try {
      services = JSON.parse(app.services);
    } catch {
      // ignore
    }

    const minPrices = services.map((s: any) => Number(s.minPrice) || 100);
    const maxPrices = services.map((s: any) => Number(s.maxPrice) || Number(s.minPrice) || 200);

    const calculatedMin = minPrices.length > 0 ? Math.min(...minPrices) : 100;
    const calculatedMax = maxPrices.length > 0 ? Math.max(...maxPrices) : 500;

    const slugBase = app.name
      .toLowerCase()
      .replace(/[^a-z0-9ğüşıöç]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    
    const slug = `${slugBase}-${Math.floor(Math.random() * 1000)}`;

    const newMerchant = await prisma.merchant.create({
      data: {
        slug,
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
        verifiedYear: new Date().getFullYear(),
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
        heroImage: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80",
        galleryImages: ["https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80"],
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

    await prisma.merchantApplication.update({
      where: { id: appId },
      data: { status: "approved" },
    });

    try {
      revalidatePath("/admin");
      revalidatePath("/");
    } catch {}
    
    return { success: true, merchantId: newMerchant.id };
  } catch (error) {
    console.error("Error approving application:", error);
    return { success: false, error: "Onay işlemi başarısız." };
  }
}

/**
 * admin (Reject Application) - Protected
 */
export async function rejectApplication(appId: string) {
  try {
    const isAdmin = await getAdminSession();
    if (!isAdmin) {
      return { success: false, error: "Yetkisiz işlem. Yönetici girişi gereklidir." };
    }

    await prisma.merchantApplication.update({
      where: { id: appId },
      data: { status: "rejected" },
    });
    try {
      revalidatePath("/admin");
    } catch {}
    return { success: true };
  } catch (error) {
    console.error("Error rejecting application:", error);
    return { success: false, error: "Reddetme işlemi başarısız." };
  }
}

/**
 * Send OTP Code to Merchant Phone
 */
export async function sendMerchantOtp(phone: string) {
  const normalizedPhone = normalizeToTenDigits(phone);
  if (!normalizedPhone) {
    return { success: false, error: "Lütfen geçerli bir telefon numarası giriniz (en az 10 hane)." };
  }

  try {
    // 1. Check live merchants
    const merchants = await prisma.merchant.findMany({
      select: { id: true, name: true, phone: true, whatsapp: true },
    });

    const matchedMerchant = merchants.find((m) => {
      const pNorm = normalizeToTenDigits(m.phone);
      const wNorm = normalizeToTenDigits(m.whatsapp);
      return pNorm === normalizedPhone || wNorm === normalizedPhone;
    });

    if (matchedMerchant) {
      const { code, expiresAt } = await generateOtp(normalizedPhone);
      return {
        success: true,
        status: "approved",
        message: "SMS / WhatsApp doğrulama kodu gönderildi.",
        expiresAt,
        ...(process.env.NODE_ENV !== "production" ? { devCode: code } : {}),
      };
    }

    // 2. Check pending applications
    const pendingApps = await prisma.merchantApplication.findMany({
      where: { status: "pending" },
      select: { id: true, name: true, masterName: true, phone: true, whatsapp: true, status: true },
    });

    const matchedApp = pendingApps.find((a) => {
      const pNorm = normalizeToTenDigits(a.phone);
      const wNorm = normalizeToTenDigits(a.whatsapp);
      return pNorm === normalizedPhone || wNorm === normalizedPhone;
    });

    if (matchedApp) {
      const { code, expiresAt } = await generateOtp(normalizedPhone);
      return {
        success: true,
        status: "pending",
        application: {
          id: matchedApp.id,
          name: matchedApp.name,
          masterName: matchedApp.masterName,
        },
        message: "Başvurunuz henüz onay aşamasındadır. Doğrulama kodu gönderildi.",
        expiresAt,
        ...(process.env.NODE_ENV !== "production" ? { devCode: code } : {}),
      };
    }

    return {
      success: false,
      status: "not_found",
      error: "Bu telefon numarasıyla kayıtlı bir esnaf veya başvuru bulunamadı.",
    };
  } catch (error) {
    console.error("Error sending merchant OTP:", error);
    return { success: false, error: "Doğrulama kodu oluşturulamadı." };
  }
}

/**
 * Verify OTP and Login Merchant
 */
export async function verifyMerchantOtpAndLogin(phone: string, code: string) {
  const normalizedPhone = normalizeToTenDigits(phone);
  if (!normalizedPhone || !code) {
    return { success: false, error: "Telefon ve doğrulama kodu gereklidir." };
  }

  const verification = await verifyOtpCode(normalizedPhone, code);
  if (!verification.success) {
    return { success: false, error: verification.error || "Geçersiz veya süresi dolmuş kod." };
  }

  try {
    const merchants = await prisma.merchant.findMany({
      include: { services: true, reviews: true },
    });

    const merchant = merchants.find((m) => {
      const pNorm = normalizeToTenDigits(m.phone);
      const wNorm = normalizeToTenDigits(m.whatsapp);
      return pNorm === normalizedPhone || wNorm === normalizedPhone;
    });

    if (merchant) {
      // Sign JWT
      const token = await signMerchantToken({
        id: merchant.id,
        phone: merchant.phone,
        slug: merchant.slug,
      });

      // Set HttpOnly Cookie (when within request context)
      try {
        const cookieStore = await cookies();
        cookieStore.set({
          name: "esnaf_session",
          value: token,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 30 * 24 * 60 * 60,
        });
      } catch {
        // Ignored when called outside Next.js request scope (tests, CLI)
      }

      return { 
        success: true, 
        status: "approved",
        token,
        merchant: ({
          ...merchant,
          category: merchant.category as any,
          tier: merchant.tier as any,
          workingHours: parseJsonField(merchant.workingHours, {}),
          galleryImages: parseJsonField(merchant.galleryImages, []),
          specialties: parseJsonField(merchant.specialties, []),
          features: parseJsonField(merchant.features, {}),
          reviews: merchant.reviews.map(r => ({ ...r, tags: typeof r.tags === "string" ? JSON.parse(r.tags || "[]") : r.tags }))
        } as unknown as Merchant)
      };
    }

    // Check pending applications
    const pendingApps = await prisma.merchantApplication.findMany();
    const matchedApp = pendingApps.find((a) => {
      const pNorm = normalizeToTenDigits(a.phone);
      const wNorm = normalizeToTenDigits(a.whatsapp);
      return pNorm === normalizedPhone || wNorm === normalizedPhone;
    });

    if (matchedApp) {
      return {
        success: false,
        status: matchedApp.status,
        application: {
          id: matchedApp.id,
          name: matchedApp.name,
          masterName: matchedApp.masterName,
        },
        error:
          matchedApp.status === "pending"
            ? `Başvurunuz (${matchedApp.name}) henüz yönetici onay aşamasındadır.`
            : "Başvurunuz onaylanmadı.",
      };
    }

    return { success: false, error: "Bu numaraya ait dükkan veya başvuru kaydı bulunamadı." };
  } catch (error) {
    console.error("Error logging in:", error);
    return { success: false, error: "Giriş işlemi tamamlanamadı." };
  }
}

/**
 * Logout Merchant
 */
export async function logoutMerchantAction() {
  try {
    const cookieStore = await cookies();
    cookieStore.set({
      name: "esnaf_session",
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  } catch {}
  return { success: true };
}

/**
 * Admin Login Action
 */
export async function loginAdminAction(password: string) {
  if (!checkAdminPassword(password)) {
    return { success: false, error: "Hatalı yönetici şifresi." };
  }

  const token = await signAdminToken();
  try {
    const cookieStore = await cookies();
    cookieStore.set({
      name: "esnaf_admin_session",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });
  } catch {}

  return { success: true, token };
}

/**
 * Admin Logout Action
 */
export async function logoutAdminAction() {
  try {
    const cookieStore = await cookies();
    cookieStore.set({
      name: "esnaf_admin_session",
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  } catch {}
  return { success: true };
}

/**
 * dukkanim (Update Profile) - Protected
 */
export async function updateMerchantProfile(id: string, updates: any) {
  try {
    // Check Merchant or Admin Session
    const merchantSession = await getMerchantSession();
    const isAdmin = await getAdminSession();

    if (!isAdmin && (!merchantSession || merchantSession.id !== id)) {
      return { success: false, error: "Yetkisiz işlem. Yalnızca kendi dükkanınızı güncelleyebilirsiniz." };
    }

    const data: any = {};
    if (updates.name) data.name = updates.name;
    if (updates.craftTitle) data.craftTitle = updates.craftTitle;
    if (updates.bio) data.bio = updates.bio;
    if (updates.heroImage) data.heroImage = updates.heroImage;
    if (updates.category) data.category = updates.category;
    if (updates.phone) data.phone = updates.phone;
    if (updates.whatsapp) data.whatsapp = updates.whatsapp;
    if (updates.workingHours) {
      data.workingHours = typeof updates.workingHours === "string" ? JSON.parse(updates.workingHours) : updates.workingHours;
    }
    if (updates.features) {
      data.features = typeof updates.features === "string" ? JSON.parse(updates.features) : updates.features;
    }
    
    if (Object.keys(data).length > 0) {
      await prisma.merchant.update({
        where: { id },
        data,
      });
    }

    // Service updates: upsert and soft-archive to preserve appointment history
    if (updates.services) {
      const incomingIds = updates.services
        .filter((s: any) => Boolean(s.id))
        .map((s: any) => String(s.id));

      await prisma.serviceItem.updateMany({
        where: {
          merchantId: id,
          id: { notIn: incomingIds },
          isArchived: false,
        },
        data: {
          isArchived: true,
        },
      });

      for (let idx = 0; idx < updates.services.length; idx++) {
        const s = updates.services[idx];
        const sData = {
          name: s.name,
          description: s.description || null,
          minPrice: Number(s.minPrice) || 0,
          maxPrice: s.maxPrice ? Number(s.maxPrice) : null,
          popular: s.popular ?? (idx === 0),
          isArchived: false,
        };

        if (s.id) {
          await prisma.serviceItem.update({
            where: { id: s.id },
            data: sData,
          });
        } else {
          await prisma.serviceItem.create({
            data: {
              merchantId: id,
              ...sData,
            },
          });
        }
      }

      const minPrices = updates.services.map((s: any) => Number(s.minPrice) || 0).filter((p: number) => p > 0);
      const maxPrices = updates.services.map((s: any) => Number(s.maxPrice) || Number(s.minPrice) || 0).filter((p: number) => p > 0);

      const calculatedMin = minPrices.length > 0 ? Math.min(...minPrices) : 100;
      const calculatedMax = maxPrices.length > 0 ? Math.max(...maxPrices) : 500;

      await prisma.merchant.update({
        where: { id },
        data: {
          minPrice: calculatedMin,
          maxPrice: calculatedMax,
        },
      });
    }

    try {
      revalidatePath("/dukkanim");
      revalidatePath("/");
    } catch {}
    
    return { success: true };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { success: false, error: "Güncelleme başarısız." };
  }
}


/**
 * dukkanim (Check Pending by Phone) - Privacy-Preserving Minimal Query
 * Enforces strict exact equality on normalized 10-digit phone number.
 * Returns only minimal status to prevent PII exposure (KVKK/GDPR).
 */
export async function checkPendingByPhone(phone: string) {
  const normalizedPhone = normalizeToTenDigits(phone);
  if (!normalizedPhone) {
    return { success: false, exists: false, error: "Geçersiz telefon numarası." };
  }

  try {
    const apps = await prisma.merchantApplication.findMany({
      where: { status: "pending" },
      select: { phone: true, whatsapp: true, status: true },
    });

    const pending = apps.find((a) => {
      const pNorm = normalizeToTenDigits(a.phone);
      const wNorm = normalizeToTenDigits(a.whatsapp);
      return pNorm === normalizedPhone || wNorm === normalizedPhone;
    });

    if (pending) {
      return { success: true, exists: true, status: pending.status };
    }
    return { success: true, exists: false };
  } catch (error) {
    console.error("Error checking pending application:", error);
    return { success: false, exists: false };
  }
}

/**
 * dukkanim (Get Merchant by ID for Session Hydration)
 */
export async function getMerchantById(id: string) {
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { id },
      include: { services: true, reviews: true }
    });
    
    if (!merchant) return null;
    
    return ({
      ...merchant,
      category: merchant.category as any,
      tier: merchant.tier as any,
      workingHours: parseJsonField(merchant.workingHours, {}),
      galleryImages: parseJsonField(merchant.galleryImages, []),
      specialties: parseJsonField(merchant.specialties, []),
      features: parseJsonField(merchant.features, {}),
      reviews: merchant.reviews.map(r => ({ ...r, tags: typeof r.tags === "string" ? JSON.parse(r.tags || "[]") : r.tags }))
    } as unknown as Merchant);
  } catch (error) {
    return null;
  }
}

/**
 * Get current logged in merchant from cookie session
 */
export async function getCurrentMerchantSession() {
  const session = await getMerchantSession();
  if (!session) return null;
  return await getMerchantById(session.id);
}
