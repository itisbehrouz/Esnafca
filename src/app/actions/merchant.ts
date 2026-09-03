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
    revalidatePath("/admin");
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
        workingHours: JSON.stringify({
          weekdays: "09:00 - 19:30",
          saturday: "09:00 - 19:00",
          sunday: "Kapalı",
        }),
        isOpenNow: true,
        heroImage: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80",
        galleryImages: JSON.stringify(["https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80"]),
        bio: `${app.neighborhood} bölgesinde hizmet veren doğrulanmış mahalle esnafımız.`,
        specialties: JSON.stringify(services.map((s: any) => s.name).slice(0, 3)),
        features: JSON.stringify({
          transparentPricing: true,
          whatsappBooking: true,
          expressOption: true,
          homePickup: false,
        }),
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

    revalidatePath("/admin");
    revalidatePath("/");
    
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
    revalidatePath("/admin");
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
  const cleanPhone = phone.replace(/\D/g, "");
  if (cleanPhone.length < 10) return { success: false, error: "Geçersiz telefon numarası." };

  try {
    const { code, expiresAt } = generateOtp(cleanPhone);
    return {
      success: true,
      message: "Doğrulama kodu gönderildi.",
      expiresAt,
      ...(process.env.NODE_ENV !== "production" ? { devCode: code } : {}),
    };
  } catch (error) {
    return { success: false, error: "Doğrulama kodu oluşturulamadı." };
  }
}

/**
 * Verify OTP and Login Merchant
 */
export async function verifyMerchantOtpAndLogin(phone: string, code: string) {
  const cleanPhone = phone.replace(/\D/g, "");
  if (!cleanPhone || !code) return { success: false, error: "Telefon ve doğrulama kodu gereklidir." };

  const verification = verifyOtpCode(cleanPhone, code);
  if (!verification.success) {
    return { success: false, error: verification.error || "Geçersiz veya süresi dolmuş kod." };
  }

  try {
    const merchants = await prisma.merchant.findMany({
      include: { services: true, reviews: true },
    });

    const merchant = merchants.find((m) => {
      const pClean = m.phone.replace(/\D/g, "");
      const wClean = m.whatsapp.replace(/\D/g, "");
      return pClean.includes(cleanPhone) || cleanPhone.includes(pClean) || 
             wClean.includes(cleanPhone) || cleanPhone.includes(wClean);
    });

    if (!merchant) {
      return { success: false, error: "Bu numaraya ait dükkan bulunamadı." };
    }

    // Sign JWT
    const token = await signMerchantToken({
      id: merchant.id,
      phone: merchant.phone,
      slug: merchant.slug,
    });

    // Set HttpOnly Cookie
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

    return { 
      success: true, 
      token,
      merchant: {
        ...merchant,
        category: merchant.category as any,
        tier: merchant.tier as any,
        workingHours: JSON.parse(merchant.workingHours),
        galleryImages: JSON.parse(merchant.galleryImages),
        specialties: JSON.parse(merchant.specialties),
        features: JSON.parse(merchant.features),
        reviews: merchant.reviews.map(r => ({ ...r, tags: JSON.parse(r.tags) }))
      } 
    };
  } catch (error) {
    console.error("Error logging in:", error);
    return { success: false, error: "Giriş işlemi tamamlanamadı." };
  }
}

/**
 * Logout Merchant
 */
export async function logoutMerchantAction() {
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

  return { success: true };
}

/**
 * Admin Logout Action
 */
export async function logoutAdminAction() {
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
    if (typeof updates.isOpenNow === "boolean") data.isOpenNow = updates.isOpenNow;
    if (updates.workingHours) data.workingHours = JSON.stringify(updates.workingHours);
    if (updates.features) data.features = JSON.stringify(updates.features);
    
    if (Object.keys(data).length > 0) {
      await prisma.merchant.update({
        where: { id },
        data,
      });
    }

    // Service updates
    if (updates.services) {
      await prisma.serviceItem.deleteMany({
        where: { merchantId: id }
      });
      
      const minPrices = updates.services.map((s: any) => Number(s.minPrice) || 0).filter((p: number) => p > 0);
      const maxPrices = updates.services.map((s: any) => Number(s.maxPrice) || Number(s.minPrice) || 0).filter((p: number) => p > 0);

      const calculatedMin = minPrices.length > 0 ? Math.min(...minPrices) : 100;
      const calculatedMax = maxPrices.length > 0 ? Math.max(...maxPrices) : 500;

      await prisma.merchant.update({
        where: { id },
        data: {
          minPrice: calculatedMin,
          maxPrice: calculatedMax,
          services: {
            create: updates.services.map((s: any, idx: number) => ({
              name: s.name,
              description: s.description || null,
              minPrice: Number(s.minPrice) || 0,
              maxPrice: s.maxPrice ? Number(s.maxPrice) : null,
              popular: s.popular ?? (idx === 0),
            }))
          }
        }
      });
    }

    revalidatePath("/dukkanim");
    revalidatePath("/");
    
    return { success: true };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { success: false, error: "Güncelleme başarısız." };
  }
}

/**
 * Normalize phone number to 10-digit format (e.g. 5321234567)
 */
function normalizeToTenDigits(raw: string): string | null {
  const digits = (raw || "").replace(/\D/g, "");
  if (digits.length === 10) return digits;
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  if (digits.length === 12 && digits.startsWith("90")) return digits.slice(2);
  return null;
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
    
    return {
      ...merchant,
      category: merchant.category as any,
      tier: merchant.tier as any,
      workingHours: JSON.parse(merchant.workingHours),
      galleryImages: JSON.parse(merchant.galleryImages),
      specialties: JSON.parse(merchant.specialties),
      features: JSON.parse(merchant.features),
      reviews: merchant.reviews.map(r => ({ ...r, tags: JSON.parse(r.tags) }))
    };
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
