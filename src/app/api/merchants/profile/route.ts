import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getMerchantSessionFromRequest } from "@/lib/auth";
import { parseJsonField } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const session = await getMerchantSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Yetkisiz erişim. Lütfen giriş yapınız." },
        { status: 401 }
      );
    }

    const merchant = await prisma.merchant.findUnique({
      where: { id: session.id },
      include: {
        services: { where: { isArchived: false } },
        reviews: true,
      },
    });

    if (!merchant) {
      return NextResponse.json(
        { success: false, error: "Esnaf profili bulunamadı." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
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
        verified: merchant.verified,
        verifiedYear: merchant.verifiedYear,
        tier: merchant.tier,
        experienceYears: merchant.experienceYears,
        minPrice: merchant.minPrice,
        maxPrice: merchant.maxPrice,
        priceNote: merchant.priceNote,
        workingHours: parseJsonField(merchant.workingHours, {}),
        heroImage: merchant.heroImage,
        galleryImages: parseJsonField(merchant.galleryImages, []),
        bio: merchant.bio,
        specialties: parseJsonField(merchant.specialties, []),
        features: parseJsonField(merchant.features, {}),
        isOpenNow: merchant.isOpenNow,
        services: merchant.services,
        reviews: merchant.reviews.map((r) => ({
          ...r,
          tags: typeof r.tags === "string" ? JSON.parse(r.tags || "[]") : r.tags,
        })),
      },
    });
  } catch (error) {
    console.error("API Profile GET Error:", error);
    return NextResponse.json(
      { success: false, error: "Profil getirilemedi." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
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
    const { isOpenNow, name, craftTitle, bio, heroImage, category, workingHours, phone, whatsapp } = body;

    // Use verified session merchant ID
    const merchantId = session.id;

    const updateData: any = {};
    if (typeof isOpenNow === "boolean") updateData.isOpenNow = isOpenNow;
    if (name) updateData.name = name;
    if (craftTitle) updateData.craftTitle = craftTitle;
    if (bio) updateData.bio = bio;
    if (heroImage) updateData.heroImage = heroImage;
    if (category) updateData.category = category;
    if (phone) updateData.phone = phone;
    if (whatsapp) updateData.whatsapp = whatsapp;
    if (workingHours) {
      updateData.workingHours = typeof workingHours === "string" ? JSON.parse(workingHours) : workingHours;
    }

    const updated = await prisma.merchant.update({
      where: { id: merchantId },
      data: updateData,
      include: {
        services: true,
        reviews: true,
      },
    });

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
        workingHours: parseJsonField(updated.workingHours, {}),
        heroImage: updated.heroImage,
        galleryImages: parseJsonField(updated.galleryImages, []),
        bio: updated.bio,
        specialties: parseJsonField(updated.specialties, []),
        features: parseJsonField(updated.features, {}),
        isOpenNow: updated.isOpenNow,
        services: updated.services,
        reviews: updated.reviews.map((r) => ({
          ...r,
          tags: typeof r.tags === "string" ? JSON.parse(r.tags || "[]") : r.tags,
        })),
      },
    });
  } catch (error) {
    console.error("API Profile Update Error:", error);
    return NextResponse.json(
      { success: false, error: "Profil güncellenemedi." },
      { status: 500 }
    );
  }
}
