import { NextResponse } from "next/server";
import { getMerchantSessionFromRequest } from "@/lib/auth";
import { createCheckoutSession } from "@/lib/payment";

export async function POST(request: Request) {
  try {
    const session = await getMerchantSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Yetkisiz erişim. Lütfen giriş yapınız." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { tier, billingInterval } = body;

    if (!tier || !["free", "pro", "plus"].includes(tier)) {
      return NextResponse.json(
        { success: false, error: "Geçerli bir paket seçiniz (pro, plus)." },
        { status: 400 }
      );
    }

    const result = await createCheckoutSession({
      merchantId: session.id,
      tier,
      billingInterval: billingInterval === "annual" ? "annual" : "monthly",
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      checkoutUrl: result.checkoutUrl,
      paymentId: result.paymentId,
    });
  } catch (error) {
    console.error("Checkout API Error:", error);
    return NextResponse.json(
      { success: false, error: "Ödeme oturumu başlatılamadı." },
      { status: 500 }
    );
  }
}
