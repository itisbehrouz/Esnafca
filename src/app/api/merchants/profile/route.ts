import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getMerchantSessionFromRequest } from "@/lib/auth";
import { parseJsonField } from "@/lib/utils";

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
