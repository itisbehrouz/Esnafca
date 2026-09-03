import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseJsonField } from "@/lib/utils";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const m = await prisma.merchant.findUnique({
      where: { slug },
      include: {
        services: true,
        reviews: true,
      },
    });

    if (!m) {
      return NextResponse.json(
        { success: false, error: "Esnaf bulunamadı." },
        { status: 404 }
      );
    }

    const formatted = {
      id: m.id,
      slug: m.slug,
      name: m.name,
      craftTitle: m.craftTitle,
      masterName: m.masterName,
      category: m.category,
      city: m.city,
      district: m.district,
      neighborhood: m.neighborhood,
      address: m.address,
      latitude: m.latitude,
      longitude: m.longitude,
      phone: m.phone,
      whatsapp: m.whatsapp,
      rating: m.rating,
      reviewCount: m.reviewCount,
      verified: m.verified,
      verifiedYear: m.verifiedYear,
      tier: m.tier,
      experienceYears: m.experienceYears,
      minPrice: m.minPrice,
      maxPrice: m.maxPrice,
      priceNote: m.priceNote,
      workingHours: parseJsonField(m.workingHours, {}),
      heroImage: m.heroImage,
      galleryImages: parseJsonField(m.galleryImages, []),
      bio: m.bio,
      specialties: parseJsonField(m.specialties, []),
      features: parseJsonField(m.features, {}),
      isOpenNow: m.isOpenNow,
      services: m.services,
      reviews: m.reviews.map((r) => ({
        ...r,
        tags: typeof r.tags === "string" ? JSON.parse(r.tags || "[]") : r.tags,
      })),
    };

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error("API Single Merchant Error:", error);
    return NextResponse.json(
      { success: false, error: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}
