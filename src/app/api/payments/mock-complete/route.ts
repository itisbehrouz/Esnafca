import { NextResponse } from "next/server";
import { applySubscriptionPayment } from "@/lib/payment";
import { SubscriptionTierId } from "@/data/pricing-plans";
import { env } from "@/lib/env";

export async function GET(request: Request) {
  // This route exists only to simulate a completed payment while no real
  // provider is wired up. It upgrades a merchant's tier with no auth check
  // by design (the "checkout" redirect calls it directly), so it must never
  // be reachable in production or with a real provider configured.
  if (env.IS_PROD || env.PAYMENT_PROVIDER !== "mock") {
    return NextResponse.json(
      { success: false, error: "Bu uç nokta yalnızca geliştirme/mock modunda kullanılabilir." },
      { status: 404 }
    );
  }

  const url = new URL(request.url);
  const merchantId = url.searchParams.get("merchantId");
  const tier = url.searchParams.get("tier") as SubscriptionTierId | null;
  const paymentId = url.searchParams.get("paymentId") || `mock_${Date.now()}`;
  const price = Number(url.searchParams.get("price")) || 390;

  if (!merchantId || !tier) {
    return NextResponse.redirect(new URL("/dukkanim?payment_error=missing_params", request.url));
  }

  await applySubscriptionPayment({
    merchantId,
    tier,
    paymentId,
    amount: price,
  });

  return NextResponse.redirect(new URL("/dukkanim?payment_success=true&tier=" + tier, request.url));
}
