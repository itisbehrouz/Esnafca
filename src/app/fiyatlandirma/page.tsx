"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Crown, 
  Package, 
  ArrowRight,
  Zap,
  Store,
  Layers
} from "lucide-react";
import { PRICING_PLANS, PricingPlan } from "@/data/pricing-plans";
import { formatNumber } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export default function FiyatlandirmaPage() {
  const router = useRouter();
  const [isAnnual, setIsAnnual] = useState<boolean>(true);

  const handleSelectPlan = (plan: PricingPlan) => {
    const cycleParam = isAnnual ? "annual" : "monthly";
    router.push(`/esnaf-ekle?plan=${plan.id}&cycle=${cycleParam}`);
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] dark:bg-black pb-24 text-black dark:text-white transition-colors duration-200">
      {/* Top Header */}
      <div className="sticky top-0 z-30 ios-blur dark:bg-black/80 border-b border-black/[0.06] dark:border-white/[0.08] transition-colors">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1 text-xs font-bold text-brand ios-press p-1.5 -ml-2 rounded-full hover:bg-black/[0.04] dark:hover:bg-white/[0.08]"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Ana Sayfa</span>
          </Link>
          <h1 className="font-extrabold text-sm text-black dark:text-white">
            Esnaf Paketleri & Üyelik
          </h1>
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-500/20 dark:border-emerald-800/40">
            <ShieldCheck className="w-4 h-4" /> %0 Komisyon Garantisi
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-black dark:text-white tracking-tight">
            İşinizden ve Siparişinizden Komisyon Kesmeyen Esnaf Dostu Paketler
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
            Müşterileriniz doğrudan WhatsApp hattınıza gelsin. İhtiyacınıza uygun paketi seçin, 90 saniyede dükkanınızı mahallenin güvenilir zanaatkârı olarak öne çıkarın.
          </p>

          {/* Billing Cycle Switcher - Apple Segmented Control */}
          <div className="pt-3 flex items-center justify-center">
            <div className="bg-zinc-200/70 dark:bg-zinc-800 p-1 rounded-full flex items-center gap-1 border border-black/[0.04] dark:border-white/[0.08]">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ios-press ${
                  !isAnnual
                    ? "bg-white dark:bg-zinc-700 text-black dark:text-white shadow-[0_1px_3px_rgba(0,0,0,0.12)]"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                }`}
              >
                Aylık Ödeme
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ios-press ${
                  isAnnual
                    ? "bg-brand text-white shadow-sm"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                }`}
              >
                <span>Yıllık Peşin</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/25 text-white font-extrabold">
                  %26 İndirim
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* 3-Tier Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2 items-stretch">
          {PRICING_PLANS.map((plan) => {
            const price = isAnnual
              ? plan.annualPrice === 0
                ? "0 TL"
                : `${formatNumber(plan.annualPrice)} ₺`
              : plan.monthlyPrice === 0
              ? "0 TL"
              : `${formatNumber(plan.monthlyPrice)} ₺`;

            const period = plan.monthlyPrice === 0 ? "Ömür Boyu" : isAnnual ? "/ yıl" : "/ ay";

            return (
              <div
                key={plan.id}
                className={`rounded-3xl border p-6 flex flex-col justify-between transition-all duration-200 relative ${
                  plan.popular
                    ? "border-brand bg-white dark:bg-[#1C1C1E] ring-2 ring-brand/80 shadow-xl md:-translate-y-2 z-10"
                    : "border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] shadow-sm"
                }`}
              >
                {/* Popular Highlight Badge */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-brand text-white text-[10px] font-extrabold uppercase tracking-wider shadow-md flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>En Çok Tercih Edilen</span>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Header Title & Tagline */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-lg text-black dark:text-white flex items-center gap-1.5">
                        {plan.id === "free" && <Store className="w-4 h-4 text-zinc-500" />}
                        {plan.id === "pro" && <Zap className="w-4 h-4 text-brand" />}
                        {plan.id === "plus" && <Crown className="w-4 h-4 text-amber-500" />}
                        <span>{plan.name}</span>
                      </h3>

                      {plan.badgeType === "blue" && (
                        <span className="p-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300" title="Mavi Doğrulanmış Rozet">
                          <ShieldCheck className="w-4 h-4" />
                        </span>
                      )}
                      {plan.badgeType === "gold" && (
                        <span className="p-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300" title="Plus Usta Rozeti">
                          <Crown className="w-4 h-4 fill-amber-700 dark:fill-amber-400" />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
                      {plan.tagline}
                    </p>
                  </div>

                  {/* Price Section */}
                  <div className="py-3 border-y border-black/[0.04] dark:border-white/[0.06]">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-black dark:text-white tracking-tight">
                        {price}
                      </span>
                      <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">{period}</span>
                    </div>
                    {isAnnual && plan.monthlyEquivalent > 0 && (
                      <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 block pt-0.5">
                        (~{formatNumber(plan.monthlyEquivalent)} ₺ / aya denk gelir)
                      </span>
                    )}
                  </div>

                  {/* Feature List */}
                  <ul className="space-y-3 text-xs text-zinc-700 dark:text-zinc-300">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span className="font-semibold text-black dark:text-white">{plan.features.listing}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>{plan.features.services}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>{plan.features.whatsapp}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>{plan.features.badge}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Package className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                      <span>{plan.features.physicalKit}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold">{plan.features.commission}</span>
                    </li>
                  </ul>
                </div>

                {/* Call-to-Action Button */}
                <div className="pt-6">
                  <button
                    onClick={() => handleSelectPlan(plan)}
                    className={`w-full py-3 px-4 rounded-full text-xs font-extrabold transition-all shadow-sm flex items-center justify-center gap-1.5 ios-press ${
                      plan.popular
                        ? "bg-brand hover:bg-brand-hover text-white shadow-brand/20 shadow-md"
                        : plan.id === "plus"
                        ? "bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-100"
                        : "bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    }`}
                  >
                    <span>
                      {plan.id === "free"
                        ? "Ücretsiz Dükkanını Aç"
                        : plan.id === "pro"
                        ? "Pro Paketle Başla"
                        : "Plus Paketle Başla"}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Simplified Comparison Summary Table */}
        <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl border border-black/[0.04] dark:border-white/[0.08] p-6 sm:p-8 space-y-4 shadow-sm overflow-x-auto">
          <h3 className="font-extrabold text-base text-black dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand" />
            <span>Paket Özellikleri Karşılaştırması</span>
          </h3>

          <table className="w-full text-left text-xs border-collapse min-w-[550px]">
            <thead>
              <tr className="border-b border-black/[0.06] dark:border-white/[0.08] text-zinc-400 dark:text-zinc-500 font-bold uppercase text-[10px]">
                <th className="py-3 px-3">Özellik / Kapsam</th>
                <th className="py-3 px-3">Mahalleli (0 TL)</th>
                <th className="py-3 px-3 text-brand">Esnafça Pro (390 TL)</th>
                <th className="py-3 px-3 text-amber-600 dark:text-amber-400">Usta Plus (890 TL)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06] text-zinc-700 dark:text-zinc-300">
              <tr>
                <td className="py-3 px-3 font-bold text-black dark:text-white">Arama & Mahalle Sıralaması</td>
                <td className="py-3 px-3 text-zinc-400 dark:text-zinc-500">Standart</td>
                <td className="py-3 px-3 font-semibold text-brand">Öncelikli Üst Sıralarda</td>
                <td className="py-3 px-3 font-extrabold text-amber-600 dark:text-amber-400">En Üst Vitrin Sıralaması</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-bold text-black dark:text-white">Hizmet & Fiyat Menüsü</td>
                <td className="py-3 px-3">5 Temel Hizmet</td>
                <td className="py-3 px-3 font-medium text-black dark:text-white">Sınırsız Canlı Menü</td>
                <td className="py-3 px-3 font-medium text-black dark:text-white">Sınırsız + Portföy Galerisi</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-bold text-black dark:text-white">Doğrulanmış Mavi Rozet</td>
                <td className="py-3 px-3 text-zinc-400 dark:text-zinc-500">-</td>
                <td className="py-3 px-3 text-blue-700 dark:text-blue-400 font-bold">Mavi Güven Rozeti</td>
                <td className="py-3 px-3 text-amber-600 dark:text-amber-400 font-extrabold">Plus Usta Damgası</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-bold text-black dark:text-white">Adrese Teslim Fiziki QR Kiti</td>
                <td className="py-3 px-3 text-zinc-400 dark:text-zinc-500">Dijital QR</td>
                <td className="py-3 px-3 font-medium">Pleksi QR Standı + Cam Çıkartması</td>
                <td className="py-3 px-3 font-bold text-black dark:text-white">Özel Işıklı / Metal Pleksi Kiti</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-bold text-black dark:text-white">Komisyon Oranı</td>
                <td className="py-3 px-3 text-emerald-600 dark:text-emerald-400 font-bold">%0 Komisyon</td>
                <td className="py-3 px-3 text-emerald-600 dark:text-emerald-400 font-bold">%0 Komisyon</td>
                <td className="py-3 px-3 text-emerald-600 dark:text-emerald-400 font-bold">%0 Komisyon</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-bold text-black dark:text-white">Destek Seviyesi</td>
                <td className="py-3 px-3">Standart</td>
                <td className="py-3 px-3 font-medium">Öncelikli WhatsApp Destek</td>
                <td className="py-3 px-3 font-bold">7/24 Birebir VIP Destek</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
