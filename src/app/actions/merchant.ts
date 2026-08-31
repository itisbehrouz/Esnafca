"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

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
 * admin (Get Pending Applications)
 */
export async function getPendingApplications() {
  try {
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
 * admin (Approve Application)
 */
export async function approveApplication(appId: string) {
  try {
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
 * admin (Reject Application)
 */
export async function rejectApplication(appId: string) {
  try {
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
 * dukkanim (Login by Phone)
 */
export async function loginMerchantByPhone(phone: string) {
  const cleanPhone = phone.replace(/\D/g, "");
  if (!cleanPhone) return { success: false, error: "Geçersiz telefon." };

  try {
    // Basic lookup - in a real app this would use SMS OTP
    const merchants = await prisma.merchant.findMany({
      include: { services: true, reviews: true },
    });

    const merchant = merchants.find((m) => {
      const pClean = m.phone.replace(/\D/g, "");
      const wClean = m.whatsapp.replace(/\D/g, "");
      return pClean.includes(cleanPhone) || cleanPhone.includes(pClean) || 
             wClean.includes(cleanPhone) || cleanPhone.includes(wClean);
    });

    if (!merchant) return { success: false, error: "Bu numaraya ait dükkan bulunamadı." };

    return { 
      success: true, 
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
    return { success: false, error: "Giriş yapılamadı." };
  }
}

/**
 * dukkanim (Update Profile)
 */
export async function updateMerchantProfile(id: string, updates: any) {
  try {
    // Fields that are stored directly vs JSON
    const data: any = {};
    
    if (updates.name) data.name = updates.name;
    if (updates.bio) data.bio = updates.bio;
    if (updates.phone) data.phone = updates.phone;
    if (updates.whatsapp) data.whatsapp = updates.whatsapp;
    
    if (updates.workingHours) data.workingHours = JSON.stringify(updates.workingHours);
    if (updates.features) data.features = JSON.stringify(updates.features);
    
    if (Object.keys(data).length > 0) {
      await prisma.merchant.update({
        where: { id },
        data,
      });
    }

    // Service updates (basic implementation)
    if (updates.services) {
      // In a real app we'd do precise upserts, here we delete all and recreate
      await prisma.serviceItem.deleteMany({
        where: { merchantId: id }
      });
      
      await prisma.merchant.update({
        where: { id },
        data: {
          services: {
            create: updates.services.map((s: any) => ({
              name: s.name,
              description: s.description,
              minPrice: Number(s.minPrice) || 0,
              maxPrice: Number(s.maxPrice),
              popular: s.popular || false,
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
 * dukkanim (Check Pending by Phone)
 */
export async function checkPendingByPhone(phone: string) {
  const cleanPhone = phone.replace(/\D/g, "");
  if (!cleanPhone) return { success: false };

  try {
    const apps = await prisma.merchantApplication.findMany({
      where: { status: "pending" },
    });

    const pending = apps.find((a) => {
      const pClean = a.phone.replace(/\D/g, "");
      const wClean = a.whatsapp.replace(/\D/g, "");
      return pClean.includes(cleanPhone) || cleanPhone.includes(pClean) || 
             wClean.includes(cleanPhone) || cleanPhone.includes(wClean);
    });

    if (pending) {
      return { success: true, application: pending };
    }
    return { success: false };
  } catch (error) {
    return { success: false };
  }
}

/**
 * dukkanim (Get Merchant by ID for Auth persistence)
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
