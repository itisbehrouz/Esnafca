import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city");
  const district = searchParams.get("district");
  const category = searchParams.get("category");
  const q = searchParams.get("q");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
  const skip = (page - 1) * limit;

  try {
    const whereClause: any = {};

    if (city && city !== "Tüm Şehirler" && city !== "all") {
      whereClause.city = city;
    }
    if (district && district !== "Tüm Bölgeler" && district !== "all") {
      whereClause.district = district;
    }
    if (category && category !== "all") {
      whereClause.category = category;
    }

    if (q && q.trim()) {
      const search = q.trim();
      whereClause.OR = [
        { name: { contains: search } },
        { masterName: { contains: search } },
        { craftTitle: { contains: search } },
        { district: { contains: search } },
        { neighborhood: { contains: search } },
        { bio: { contains: search } },
      ];
    }

    const [total, merchants] = await Promise.all([
      prisma.merchant.count({ where: whereClause }),
      prisma.merchant.findMany({
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
        skip,
        take: limit,
      }),
    ]);

    const formatted = merchants.map((m) => ({
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

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      total,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages,
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
