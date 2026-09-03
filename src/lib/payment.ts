import { prisma } from "@/lib/db";
import { PRICING_PLANS, SubscriptionTierId } from "@/data/pricing-plans";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

export interface CreateCheckoutParams {
  merchantId: string;
  tier: SubscriptionTierId;
  billingInterval: "monthly" | "annual";
  successUrl?: string;
  cancelUrl?: string;
}

export interface CheckoutResult {
  success: boolean;
  checkoutUrl?: string;
  paymentId?: string;
  error?: string;
}

/**
 * Create a Checkout Session for Merchant Subscription
 */
export async function createCheckoutSession(params: CreateCheckoutParams): Promise<CheckoutResult> {
  const plan = PRICING_PLANS.find((p) => p.id === params.tier);
  if (!plan) {
    return { success: false, error: "Geçersiz abonelik paketi." };
  }

  const merchant = await prisma.merchant.findUnique({
    where: { id: params.merchantId },
  });

  if (!merchant) {
    return { success: false, error: "Dükkan kaydı bulunamadı." };
  }

  const price = params.billingInterval === "annual" ? plan.annualPrice : plan.monthlyPrice;
  const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  logger.info("Created checkout session", {
    merchantId: params.merchantId,
    tier: params.tier,
    price,
    provider: env.PAYMENT_PROVIDER,
  });

  // Mock / Sandbox Provider (Simulation URL)
  if (env.PAYMENT_PROVIDER === "mock" || !env.IYZICO_API_KEY) {
    const mockCheckoutUrl = `/api/payments/mock-complete?paymentId=${paymentId}&merchantId=${params.merchantId}&tier=${params.tier}&price=${price}`;
    return {
      success: true,
      checkoutUrl: mockCheckoutUrl,
      paymentId,
    };
  }

  // Real iyzico / PayTR implementation seam
  return {
    success: true,
    checkoutUrl: `https://sandbox-api.iyzipay.com/payment/mock?id=${paymentId}`,
    paymentId,
  };
}

/**
 * Handle Successful Payment & Upgrade Merchant Tier
 */
export async function applySubscriptionPayment(params: {
  merchantId: string;
  tier: SubscriptionTierId;
  paymentId: string;
  amount: number;
}) {
  try {
    const merchant = await prisma.merchant.update({
      where: { id: params.merchantId },
      data: {
        tier: params.tier,
        verified: params.tier === "pro" || params.tier === "plus" ? true : undefined,
        verifiedYear: params.tier === "pro" || params.tier === "plus" ? new Date().getFullYear() : undefined,
      },
    });

    logger.info("Merchant Tier Upgraded Successfully", {
      merchantId: params.merchantId,
      newTier: params.tier,
      paymentId: params.paymentId,
    });

    return { success: true, merchant };
  } catch (error) {
    logger.error("Failed to apply subscription upgrade", error, { params });
    return { success: false, error: "Paket güncellenemedi." };
  }
}
