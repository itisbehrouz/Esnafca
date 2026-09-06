import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { signMerchantToken } from "@/lib/auth";
import { verifyOtpCode } from "@/lib/otp";
import { parseJsonField, normalizeToTenDigits } from "@/lib/utils";

/**
 * POST /api/merchants/auth
 * Authenticates merchant using phone and OTP verification, generates signed JWT
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, otp } = body;

    if (!phone) {
      return NextResponse.json(
        { success: false, error: "Telefon numarası gereklidir." },
        { status: 400 }
      );
    }

    if (!otp) {
      return NextResponse.json(
        { success: false, error: "Doğrulama kodu (OTP) gereklidir. Önce /api/merchants/auth/send-otp ile kod isteyin." },
        { status: 400 }
      );
    }

    const normalizedInput = normalizeToTenDigits(phone);
    if (!normalizedInput) {
      return NextResponse.json(
        { success: false, error: "Geçerli bir telefon numarası giriniz (en az 10 hane)." },
        { status: 400 }
      );
    }

    // OTP is mandatory — no code, no session. This closes the phone-only
    // bypass that used to issue a session without ever checking a code.
    const otpRes = await verifyOtpCode(normalizedInput, otp);
    if (!otpRes.success) {
      return NextResponse.json(
        { success: false, error: otpRes.error || "Hatalı doğrulama kodu." },
        { status: 401 }
      );
    }

    // Check Approved Merchants
    const allMerchants = await prisma.merchant.findMany({
      include: {
        services: true,
        reviews: true,
      },
    });

    const matchedMerchant = allMerchants.find((m) => {
      const pNorm = normalizeToTenDigits(m.phone);
      const wNorm = normalizeToTenDigits(m.whatsapp);
      return pNorm === normalizedInput || wNorm === normalizedInput;
    });

    if (matchedMerchant) {
      const token = await signMerchantToken({
        id: matchedMerchant.id,
        phone: matchedMerchant.phone,
        slug: matchedMerchant.slug,
      });

      const res = NextResponse.json({
        success: true,
        status: "approved",
        token,
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
          workingHours: parseJsonField(matchedMerchant.workingHours, {}),
          heroImage: matchedMerchant.heroImage,
          galleryImages: parseJsonField(matchedMerchant.galleryImages, []),
          bio: matchedMerchant.bio,
          specialties: parseJsonField(matchedMerchant.specialties, []),
          features: parseJsonField(matchedMerchant.features, {}),
          services: matchedMerchant.services,
          reviews: matchedMerchant.reviews.map((r) => ({
            ...r,
            tags: typeof r.tags === "string" ? JSON.parse(r.tags || "[]") : r.tags,
          })),
        },
      });

      res.cookies.set({
        name: "esnaf_session",
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
      });

      return res;
    }

    // Check Pending Applications
    const allApps = await prisma.merchantApplication.findMany();
    const matchedApp = allApps.find((a) => {
      const pNorm = normalizeToTenDigits(a.phone);
      const wNorm = normalizeToTenDigits(a.whatsapp);
      return pNorm === normalizedInput || wNorm === normalizedInput;
    });

    if (matchedApp) {
      return NextResponse.json({
        success: true,
        status: matchedApp.status,
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
    }, { status: 404 });
  } catch (error) {
    console.error("API Auth Error:", error);
    return NextResponse.json(
      { success: false, error: "Giriş işlemi başarısız oldu." },
      { status: 500 }
    );
  }
}
