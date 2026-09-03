import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { applySubscriptionPayment } from "@/lib/payment";
import { logger } from "@/lib/logger";
import { env } from "@/lib/env";

/**
 * The real provider (iyzico/PayTR) signs its webhook calls; until that
 * integration lands, this checks a shared secret instead so the endpoint
 * can't be used to grant a free tier upgrade to anyone who finds the URL.
 * Configure the same value at the provider and in PAYMENT_WEBHOOK_SECRET.
 */
function hasValidWebhookSecret(request: Request): boolean {
  const expected = env.PAYMENT_WEBHOOK_SECRET;
  if (!expected) return false; // never accept a call if no secret is configured

  const provided = request.headers.get("x-webhook-secret") || "";
  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(provided);
  if (expectedBuf.length !== providedBuf.length) return false;
  return timingSafeEqual(expectedBuf, providedBuf);
}

export async function POST(request: Request) {
  try {
    if (!hasValidWebhookSecret(request)) {
      logger.warn("Rejected payment webhook: missing or invalid x-webhook-secret");
      return NextResponse.json({ success: false, error: "Yetkisiz istek." }, { status: 401 });
    }

    const body = await request.json();
    const { merchantId, tier, paymentId, amount, status } = body;

    logger.info("Received payment webhook notification", { paymentId, status, merchantId });

    if (status !== "success" && status !== "PAID") {
      return NextResponse.json({ received: true, status: "ignored" });
    }

    if (!merchantId || !tier) {
      return NextResponse.json(
        { success: false, error: "Eksik parametreler." },
        { status: 400 }
      );
    }

    const upgradeResult = await applySubscriptionPayment({
      merchantId,
      tier,
      paymentId: paymentId || `wh_${Date.now()}`,
      amount: Number(amount) || 0,
    });

    if (!upgradeResult.success) {
      return NextResponse.json(
        { success: false, error: upgradeResult.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Abonelik başarıyla aktifleştirildi.",
    });
  } catch (error) {
    logger.error("Payment Webhook Handler Error", error);
    return NextResponse.json(
      { success: false, error: "Webhook işlenemedi." },
      { status: 500 }
    );
  }
}
