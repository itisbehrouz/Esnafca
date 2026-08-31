import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const demoMerchants = await prisma.merchant.findMany({
      take: 6,
      orderBy: { rating: "desc" },
      include: {
        services: true,
        reviews: true,
      },
    });

    const formatted = demoMerchants.map((m) => ({
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

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error("API Get Demo Merchants Error:", error);
    return NextResponse.json(
      { success: false, error: "Demo hesaplar alınamadı." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, id } = body;

    // 1. Direct ID Login (e.g. 1-Tap Fast Demo Login)
    if (id) {
      const merchant = await prisma.merchant.findUnique({
        where: { id },
        include: { services: true, reviews: true },
      });

      if (merchant) {
        return NextResponse.json({
          success: true,
          status: "approved",
          merchant: {
            id: merchant.id,
            slug: merchant.slug,
            name: merchant.name,
            craftTitle: merchant.craftTitle,
            masterName: merchant.masterName,
            category: merchant.category,
            city: merchant.city,
            district: merchant.district,
            neighborhood: merchant.neighborhood,
            address: merchant.address,
            latitude: merchant.latitude,
            longitude: merchant.longitude,
            phone: merchant.phone,
            whatsapp: merchant.whatsapp,
            rating: merchant.rating,
            reviewCount: merchant.reviewCount,
            tier: merchant.tier,
            isOpenNow: merchant.isOpenNow,
            workingHours: JSON.parse(merchant.workingHours || "{}"),
            heroImage: merchant.heroImage,
            galleryImages: JSON.parse(merchant.galleryImages || "[]"),
            bio: merchant.bio,
            specialties: JSON.parse(merchant.specialties || "[]"),
            features: JSON.parse(merchant.features || "{}"),
            services: merchant.services,
            reviews: merchant.reviews.map((r) => ({
              ...r,
              tags: JSON.parse(r.tags || "[]"),
            })),
          },
        });
      }
    }

    if (!phone) {
      return NextResponse.json(
        { success: false, error: "Telefon numarası gereklidir." },
        { status: 400 }
      );
    }

    const cleanInput = phone.replace(/\D/g, "");

    // 2. Check Approved Merchants
    const allMerchants = await prisma.merchant.findMany({
      include: {
        services: true,
        reviews: true,
      },
    });

    const matchedMerchant = allMerchants.find((m) => {
      const dbPhone = m.phone.replace(/\D/g, "");
      const dbWhatsapp = m.whatsapp.replace(/\D/g, "");
      return (
        dbPhone.endsWith(cleanInput) ||
        cleanInput.endsWith(dbPhone) ||
        dbWhatsapp.endsWith(cleanInput) ||
        cleanInput.endsWith(dbWhatsapp)
      );
    });

    if (matchedMerchant) {
      return NextResponse.json({
        success: true,
        status: "approved",
        merchant: {
          id: matchedMerchant.id,
          slug: matchedMerchant.slug,
          name: matchedMerchant.name,
          craftTitle: matchedMerchant.craftTitle,
          masterName: matchedMerchant.masterName,
          category: matchedMerchant.category,
          city: matchedMerchant.city,
          district: matchedMerchant.district,
          neighborhood: matchedMerchant.neighborhood,
          address: matchedMerchant.address,
          latitude: matchedMerchant.latitude,
          longitude: matchedMerchant.longitude,
          phone: matchedMerchant.phone,
          whatsapp: matchedMerchant.whatsapp,
          rating: matchedMerchant.rating,
          reviewCount: matchedMerchant.reviewCount,
          tier: matchedMerchant.tier,
          isOpenNow: matchedMerchant.isOpenNow,
          workingHours: JSON.parse(matchedMerchant.workingHours || "{}"),
          heroImage: matchedMerchant.heroImage,
          galleryImages: JSON.parse(matchedMerchant.galleryImages || "[]"),
          bio: matchedMerchant.bio,
          specialties: JSON.parse(matchedMerchant.specialties || "[]"),
          features: JSON.parse(matchedMerchant.features || "{}"),
          services: matchedMerchant.services,
          reviews: matchedMerchant.reviews.map((r) => ({
            ...r,
            tags: JSON.parse(r.tags || "[]"),
          })),
        },
      });
    }

    // 3. Check Pending Applications
    const allApps = await prisma.merchantApplication.findMany();
    const matchedApp = allApps.find((a) => {
      const dbPhone = a.phone.replace(/\D/g, "");
      const dbWhatsapp = a.whatsapp.replace(/\D/g, "");
      return (
        dbPhone.endsWith(cleanInput) ||
        cleanInput.endsWith(dbPhone) ||
        dbWhatsapp.endsWith(cleanInput) ||
        cleanInput.endsWith(dbWhatsapp)
      );
    });

    if (matchedApp) {
      return NextResponse.json({
        success: true,
        status: matchedApp.status, // "pending" or "rejected"
        application: matchedApp,
        message:
          matchedApp.status === "pending"
            ? "Başvurunuz henüz onay aşamasındadır."
            : "Başvurunuz onaylanmadı.",
      });
    }

    return NextResponse.json({
      success: false,
      status: "not_found",
      error: "Bu telefon numarasıyla kayıtlı bir esnaf veya başvuru bulunamadı.",
    });
  } catch (error) {
    console.error("API Auth Error:", error);
    return NextResponse.json(
      { success: false, error: "Giriş işlemi başarısız oldu." },
      { status: 500 }
    );
  }
}
