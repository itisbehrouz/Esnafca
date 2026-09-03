import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyOtpCode } from "@/lib/otp";
import { signMerchantToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, code } = body;

    if (!phone || !code) {
      return NextResponse.json(
        { success: false, error: "Telefon numarası ve 6 haneli doğrulama kodu gereklidir." },
        { status: 400 }
      );
    }

    const cleanInput = phone.replace(/\D/g, "");

    // 1. Verify OTP code
    const otpVerification = verifyOtpCode(cleanInput, code);
    if (!otpVerification.success) {
      return NextResponse.json(
        { success: false, error: otpVerification.error || "Geçersiz veya süresi dolmuş kod." },
        { status: 401 }
      );
    }

    // 2. Fetch Merchant from Database
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
      // 3. Generate Signed JWT Session Token
      const token = await signMerchantToken({
        id: matchedMerchant.id,
        phone: matchedMerchant.phone,
        slug: matchedMerchant.slug,
      });

      const formattedMerchant = {
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
      };

      const response = NextResponse.json({
        success: true,
        status: "approved",
        token,
        merchant: formattedMerchant,
      });

      // 4. Set HttpOnly Cookie for Web
      response.cookies.set({
        name: "esnaf_session",
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });

      return response;
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
        status: matchedApp.status,
        application: matchedApp,
        message:
          matchedApp.status === "pending"
            ? "Başvurunuz henüz onay aşamasındadır. Yöneticilerimiz incelemektedir."
            : "Başvurunuz onaylanmadı.",
      });
    }

    return NextResponse.json(
      { success: false, error: "Esnaf kaydı bulunamadı." },
      { status: 404 }
    );
  } catch (error) {
    console.error("Verify OTP Error:", error);
    return NextResponse.json(
      { success: false, error: "Doğrulama işlemi başarısız oldu." },
      { status: 500 }
    );
  }
}
