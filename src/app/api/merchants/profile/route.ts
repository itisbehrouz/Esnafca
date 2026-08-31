import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, isOpenNow, name, craftTitle, bio, heroImage, category, workingHours, phone, whatsapp } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Dükkan ID gereklidir." },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (typeof isOpenNow === "boolean") updateData.isOpenNow = isOpenNow;
    if (name) updateData.name = name;
    if (craftTitle) updateData.craftTitle = craftTitle;
    if (bio) updateData.bio = bio;
    if (heroImage) updateData.heroImage = heroImage;
    if (category) updateData.category = category;
    if (phone) updateData.phone = phone;
    if (whatsapp) updateData.whatsapp = whatsapp;
    if (workingHours) updateData.workingHours = JSON.stringify(workingHours);

    const updated = await prisma.merchant.update({
      where: { id },
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
    console.error("API Profile Update Error:", error);
    return NextResponse.json(
      { success: false, error: "Profil güncellenemedi." },
      { status: 500 }
    );
  }
}
