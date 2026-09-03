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

    // Delete existing services and insert new list
    await prisma.serviceItem.deleteMany({
      where: { merchantId },
    });

    const minPrices = services.map((s: any) => Number(s.minPrice) || 0).filter((p: number) => p > 0);
    const maxPrices = services.map((s: any) => Number(s.maxPrice) || Number(s.minPrice) || 0).filter((p: number) => p > 0);

    const calculatedMin = minPrices.length > 0 ? Math.min(...minPrices) : 100;
    const calculatedMax = maxPrices.length > 0 ? Math.max(...maxPrices) : 500;

    await prisma.merchant.update({
      where: { id: merchantId },
      data: {
        minPrice: calculatedMin,
        maxPrice: calculatedMax,
        services: {
          create: services.map((s: any, idx: number) => ({
            name: s.name,
            description: s.description || null,
            minPrice: Number(s.minPrice) || 0,
            maxPrice: s.maxPrice ? Number(s.maxPrice) : null,
            popular: s.popular ?? (idx === 0),
          })),
        },
      },
    });

    const updated = await prisma.merchant.findUnique({
      where: { id: merchantId },
      include: {
        services: true,
        reviews: true,
      },
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Dükkan bulunamadı." },
        { status: 404 }
      );
    }

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
        workingHours: JSON.parse(updated.workingHours || "{}"),
        heroImage: updated.heroImage,
        galleryImages: JSON.parse(updated.galleryImages || "[]"),
        bio: updated.bio,
        specialties: JSON.parse(updated.specialties || "[]"),
        features: JSON.parse(updated.features || "{}"),
        isOpenNow: updated.isOpenNow,
        services: updated.services,
        reviews: updated.reviews.map((r) => ({
          ...r,
          tags: JSON.parse(r.tags || "[]"),
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
