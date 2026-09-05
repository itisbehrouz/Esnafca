import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseJsonField } from "@/lib/utils";
import { MERCHANTS } from "@/data/seed-merchants";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    let m: any = null;
    try {
      m = await prisma.merchant.findFirst({
        where: {
          OR: [{ slug }, { id: slug }],
        },
        include: {
          services: true,
          reviews: true,
        },
      });
    } catch (dbErr) {
      console.error(`[API /api/merchants/${slug}] DB lookup failed, checking seed:`, dbErr);
    }

    if (!m) {
      const seed = MERCHANTS.find((s) => s.slug === slug || s.id === slug);
      if (seed) {
        return NextResponse.json({
          success: true,
          data: seed,
        });
      }

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
      reviews: m.reviews.map((r: any) => ({
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
