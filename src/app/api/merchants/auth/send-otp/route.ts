import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateOtp } from "@/lib/otp";
import { normalizeToTenDigits } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json(
        { success: false, error: "Telefon numarası gereklidir." },
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

    // 1. Check live merchants
    const allMerchants = await prisma.merchant.findMany({
      select: { id: true, name: true, phone: true, whatsapp: true },
    });

    const matchedMerchant = allMerchants.find((m) => {
      const pNorm = normalizeToTenDigits(m.phone);
      const wNorm = normalizeToTenDigits(m.whatsapp);
      return pNorm === normalizedInput || wNorm === normalizedInput;
    });

    if (matchedMerchant) {
      const { code, expiresAt } = await generateOtp(normalizedInput);
      return NextResponse.json({
        success: true,
        status: "approved",
        message: "SMS / WhatsApp doğrulama kodu gönderildi.",
        expiresAt,
        ...(process.env.NODE_ENV !== "production" ? { devCode: code } : {}),
      });
    }

    // 2. Check pending applications
    const allApps = await prisma.merchantApplication.findMany({
      where: { status: "pending" },
      select: { id: true, name: true, phone: true, whatsapp: true, status: true },
    });

    const matchedApp = allApps.find((a) => {
      const pNorm = normalizeToTenDigits(a.phone);
      const wNorm = normalizeToTenDigits(a.whatsapp);
      return pNorm === normalizedInput || wNorm === normalizedInput;
    });

    if (matchedApp) {
      const { code, expiresAt } = await generateOtp(normalizedInput);
      return NextResponse.json({
        success: true,
        status: "pending",
        message: "Başvurunuz henüz onay aşamasındadır. Doğrulama kodu gönderildi.",
        expiresAt,
        ...(process.env.NODE_ENV !== "production" ? { devCode: code } : {}),
      });
    }

    return NextResponse.json(
      {
        success: false,
        status: "not_found",
        error: "Bu telefon numarasıyla kayıtlı bir esnaf veya başvuru bulunamadı.",
      },
      { status: 404 }
    );
  } catch (error) {
    console.error("Send OTP Error:", error);
    return NextResponse.json(
      { success: false, error: "Doğrulama kodu gönderilemedi." },
      { status: 500 }
    );
  }
}
