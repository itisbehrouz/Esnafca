import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { signMerchantToken } from "@/lib/auth";
import { verifyOtpCode } from "@/lib/otp";
import { parseJsonField } from "@/lib/utils";

/**
 * GET /api/merchants/auth
 * Returns demo / verified merchant list for public preview
 */
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
      workingHours: parseJsonField(m.workingHours, {}),
      heroImage: m.heroImage,
      galleryImages: parseJsonField(m.galleryImages, []),
      bio: m.bio,
      specialties: parseJsonField(m.specialties, []),
      features: parseJsonField(m.features, {}),
      isOpenNow: m.isOpenNow,
      services: m.services,
      reviews: m.reviews.map((r) => ({
        ...r,
        tags: typeof r.tags === "string" ? JSON.parse(r.tags || "[]") : r.tags,
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

/**
 * POST /api/merchants/auth
 * Authenticates merchant using OTP (or verified credentials in dev mode), generates signed JWT
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, otp, id } = body;

    // Fast test demo bypass ONLY in development
    if (process.env.NODE_ENV !== "production" && id) {
      const merchant = await prisma.merchant.findUnique({
        where: { id },
        include: { services: true, reviews: true },
      });

      if (merchant) {
        const token = await signMerchantToken({
          id: merchant.id,
          phone: merchant.phone,
          slug: merchant.slug,
        });

        const res = NextResponse.json({
          success: true,
          status: "approved",
          token,
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
            workingHours: parseJsonField(merchant.workingHours, {}),
            heroImage: merchant.heroImage,
            galleryImages: parseJsonField(merchant.galleryImages, []),
            bio: merchant.bio,
            specialties: parseJsonField(merchant.specialties, []),
            features: parseJsonField(merchant.features, {}),
            services: merchant.services,
            reviews: merchant.reviews.map((r) => ({
              ...r,
              tags: typeof r.tags === "string" ? JSON.parse(r.tags || "[]") : r.tags,
            })),
          },
        });

        res.cookies.set({
          name: "esnaf_session",
          value: token,
          httpOnly: true,
          secure: false,
          sameSite: "lax",
          path: "/",
          maxAge: 30 * 24 * 60 * 60,
        });

        return res;
      }
    }

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

    const cleanInput = phone.replace(/\D/g, "");

    // OTP is mandatory — no code, no session. This closes the phone-only
    // bypass that used to issue a session without ever checking a code.
    const otpRes = await verifyOtpCode(cleanInput, otp);
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
