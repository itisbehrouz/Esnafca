import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city");
  const district = searchParams.get("district");
  const category = searchParams.get("category");
  const q = searchParams.get("q");

  try {
    const whereClause: any = {};

    if (city && city !== "Tüm Şehirler") {
      whereClause.city = city;
    }
    if (district && district !== "Tüm Bölgeler") {
      whereClause.district = district;
    }
    if (category && category !== "all") {
      whereClause.category = category;
    }

    const merchants = await prisma.merchant.findMany({
      where: whereClause,
      include: {
        services: true,
        reviews: true,
      },
      orderBy: [
        { tier: "desc" },
        { rating: "desc" },
        { reviewCount: "desc" },
      ],
    });

    let formatted = merchants.map((m) => ({
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
    }));

    if (q && q.trim()) {
      const query = q.toLowerCase().trim();
      formatted = formatted.filter(
        (m) =>
          m.name.toLowerCase().includes(query) ||
          m.masterName.toLowerCase().includes(query) ||
          m.craftTitle.toLowerCase().includes(query) ||
          m.district.toLowerCase().includes(query) ||
          m.city.toLowerCase().includes(query)
      );
    }

    return NextResponse.json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error) {
    console.error("API Merchants Error:", error);
    return NextResponse.json(
      { success: false, error: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}
