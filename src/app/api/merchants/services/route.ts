import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getMerchantSessionFromRequest } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    // 1. Authenticate Request via JWT / HttpOnly Session Cookie
    const session = await getMerchantSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Yetkisiz erişim. Lütfen giriş yapınız." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { services } = body;

    if (!Array.isArray(services)) {
      return NextResponse.json(
        { success: false, error: "services dizisi gereklidir." },
        { status: 400 }
      );
    }

    // Use verified session merchant ID
    const merchantId = session.id;

    const minPrices = services.map((s: any) => Number(s.minPrice) || 0).filter((p: number) => p > 0);
    const maxPrices = services.map((s: any) => Number(s.maxPrice) || Number(s.minPrice) || 0).filter((p: number) => p > 0);

    const calculatedMin = minPrices.length > 0 ? Math.min(...minPrices) : 100;
    const calculatedMax = maxPrices.length > 0 ? Math.max(...maxPrices) : 500;

    // 1. Soft-archive any services no longer in the submitted list (preserves Appointment foreign keys)
    const incomingIds = services
      .filter((s: any) => Boolean(s.id))
      .map((s: any) => String(s.id));

    await prisma.serviceItem.updateMany({
      where: {
        merchantId,
        id: { notIn: incomingIds },
        isArchived: false,
      },
      data: {
        isArchived: true,
      },
    });

    // 2. Upsert each service: update existing, create new
    for (let idx = 0; idx < services.length; idx++) {
      const s = services[idx];
      const serviceData = {
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
          data: serviceData,
        });
      } else {
        await prisma.serviceItem.create({
          data: {
            merchantId,
            ...serviceData,
          },
        });
      }
    }

    // 3. Update Merchant min/max price range
    await prisma.merchant.update({
      where: { id: merchantId },
      data: {
        minPrice: calculatedMin,
        maxPrice: calculatedMax,
      },
    });

    const updated = await prisma.merchant.findUnique({
      where: { id: merchantId },
      include: {
        services: {
          where: { isArchived: false },
        },
        reviews: true,
      },
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Dükkan bulunamadı." },
        { status: 404 }
      );
    }

    const workingHours = typeof updated.workingHours === "string" ? JSON.parse(updated.workingHours || "{}") : updated.workingHours;
    const galleryImages = typeof updated.galleryImages === "string" ? JSON.parse(updated.galleryImages || "[]") : updated.galleryImages;
    const specialties = typeof updated.specialties === "string" ? JSON.parse(updated.specialties || "[]") : updated.specialties;
    const features = typeof updated.features === "string" ? JSON.parse(updated.features || "{}") : updated.features;

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        slug: updated.slug,
        name: updated.name,
        craftTitle: updated.craftTitle,
        masterName: updated.masterName,
        category: updated.category,
        city: updated.city,
        district: updated.district,
        neighborhood: updated.neighborhood,
        address: updated.address,
        latitude: updated.latitude,
        longitude: updated.longitude,
        phone: updated.phone,
        whatsapp: updated.whatsapp,
        rating: updated.rating,
        reviewCount: updated.reviewCount,
        verified: updated.verified,
        verifiedYear: updated.verifiedYear,
        tier: updated.tier,
        experienceYears: updated.experienceYears,
        minPrice: updated.minPrice,
        maxPrice: updated.maxPrice,
        priceNote: updated.priceNote,
        workingHours,
        heroImage: updated.heroImage,
        galleryImages,
        bio: updated.bio,
        specialties,
        features,
        isOpenNow: updated.isOpenNow,
        services: updated.services,
        reviews: updated.reviews.map((r) => ({
          ...r,
          tags: typeof r.tags === "string" ? JSON.parse(r.tags || "[]") : r.tags,
        })),
      },
    });
  } catch (error) {
    console.error("API Services Update Error:", error);
    return NextResponse.json(
      { success: false, error: "Hizmetler güncellenemedi." },
      { status: 500 }
    );
  }
}
