import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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
      workingHours: JSON.parse(m.workingHours || "{}"),
      heroImage: m.heroImage,
      galleryImages: JSON.parse(m.galleryImages || "[]"),
      bio: m.bio,
      specialties: JSON.parse(m.specialties || "[]"),
      features: JSON.parse(m.features || "{}"),
      isOpenNow: m.isOpenNow,
      services: m.services,
      reviews: m.reviews.map((r) => ({
        ...r,
        tags: JSON.parse(r.tags || "[]"),
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
