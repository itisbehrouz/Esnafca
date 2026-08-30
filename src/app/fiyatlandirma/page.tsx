"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Check, 
  X, 
  Sparkles, 
  ShieldCheck, 
  Crown, 
  HelpCircle, 
  MessageCircle,
  Package,
  Clock,
  MapPin,
  ArrowRight
} from "lucide-react";
import { PRICING_PLANS, PricingPlan } from "@/data/pricing-plans";
import { formatNumber } from "@/lib/utils";

export default function FiyatlandirmaPage() {
  const router = useRouter();
  const [isAnnual, setIsAnnual] = useState<boolean>(true);

  const handleSelectPlan = (plan: PricingPlan) => {
    const cycleParam = isAnnual ? "annual" : "monthly";
    router.push(`/esnaf-ekle?plan=${plan.id}&cycle=${cycleParam}`);
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] pb-24">
      {/* Top Header */}
      <div className="sticky top-0 z-30 ios-blur border-b border-black/[0.06]">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1 text-xs font-bold text-brand ios-press p-1.5 -ml-2 rounded-full hover:bg-black/[0.04]"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Ana Sayfa</span>
          </Link>
          <h1 className="font-extrabold text-sm text-black">
            Esnaf Paketleri & Üyelik
          </h1>
          <div className="w-12" />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 text-xs font-semibold border border-emerald-500/20">
            <ShieldCheck className="w-4 h-4" /> %0 Komisyon Garantisi
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight">
            İşinizden ve Siparişinizden Komisyon Kesmeyen Esnaf Dostu Paketler
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 font-medium leading-relaxed">
            Müşterileriniz doğrudan WhatsApp hattınıza gelsin. İhtiyacınıza uygun paketi seçin, 90 saniyede dükkanınızı mahallenin güvenilir zanaatkârı olarak öne çıkarın.
          </p>

          {/* Billing Cycle Switcher - Apple Segmented Control */}
          <div className="pt-3 flex items-center justify-center">
            <div className="bg-zinc-200/70 p-1 rounded-full flex items-center gap-1 border border-black/[0.04]">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ios-press ${
                  !isAnnual
                    ? "bg-white text-black shadow-[0_1px_3px_rgba(0,0,0,0.12)]"
                    : "text-zinc-600 hover:text-black"
                }`}
              >
                Aylık Ödeme
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ios-press ${
                  isAnnual
                    ? "bg-brand text-white shadow-sm"
                    : "text-zinc-600 hover:text-black"
                }`}
              >
                <span>Yıllık Peşin</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/25 text-white font-extrabold">
                  %30 İndirim
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
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
                className={`rounded-ios-card border p-5 flex flex-col justify-between transition-all duration-200 relative ${
                  plan.popular
                    ? "border-brand bg-white ring-2 ring-brand/80 shadow-lg"
                    : plan.vipExclusive
                    ? "border-amber-400 bg-gradient-to-b from-amber-50/50 to-white shadow-lg"
                    : "border-black/[0.06] bg-white shadow-ios-card"
                }`}
              >
                {/* Popular / VIP Badges */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-brand text-white text-[10px] font-extrabold uppercase tracking-wider shadow-md">
                    En Çok Tercih Edilen
                  </div>
                )}
                {plan.vipExclusive && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-md flex items-center gap-1">
                    <Crown className="w-3 h-3 fill-white" /> Mahallede Tek
                  </div>
                )}

                <div className="space-y-4">
                  {/* Title & Tagline */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-base text-black">{plan.name}</h3>
                      {plan.badgeType === "gold" && (
                        <span className="p-1 rounded-full bg-amber-100 text-amber-800">
                          <Crown className="w-4 h-4 fill-amber-700" />
                        </span>
                      )}
                      {plan.badgeType === "blue" && (
                        <span className="p-1 rounded-full bg-blue-50 text-blue-700">
                          <ShieldCheck className="w-4 h-4" />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 font-medium leading-snug">{plan.tagline}</p>
                  </div>

                  {/* Price Display */}
                  <div className="py-2 border-y border-black/[0.04]">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight">
                        {price}
                      </span>
                      <span className="text-xs font-semibold text-zinc-400">{period}</span>
                    </div>
                    {isAnnual && plan.monthlyEquivalent > 0 && (
                      <span className="text-[11px] font-medium text-emerald-700 block pt-0.5">
                        (~{formatNumber(plan.monthlyEquivalent)} ₺ / aya denk gelir)
                      </span>
                    )}
                  </div>

                  {/* Feature Bullets */}
                  <ul className="space-y-2.5 text-xs text-zinc-700">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{plan.features.listing}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{plan.features.services}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{plan.features.whatsapp}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      {plan.badgeType !== "none" ? (
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-4 h-4 text-zinc-300 shrink-0 mt-0.5" />
                      )}
                      <span className={plan.badgeType === "none" ? "text-zinc-400" : "font-semibold text-black"}>
                        {plan.features.badge}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      {plan.features.physicalKit.includes("Yok") ? (
                        <X className="w-4 h-4 text-zinc-300 shrink-0 mt-0.5" />
                      ) : (
                        <Package className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                      )}
                      <span className={plan.features.physicalKit.includes("Yok") ? "text-zinc-400" : "font-medium text-black"}>
                        {plan.features.physicalKit}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      {plan.features.autoReply.includes("Yok") ? (
                        <X className="w-4 h-4 text-zinc-300 shrink-0 mt-0.5" />
                      ) : (
                        <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      )}
                      <span className={plan.features.autoReply.includes("Yok") ? "text-zinc-400" : ""}>
                        {plan.features.autoReply}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      {plan.vipExclusive ? (
                        <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      ) : (
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      )}
                      <span className={plan.vipExclusive ? "font-bold text-amber-900" : ""}>
                        {plan.features.quota}
                      </span>
                    </li>
                  </ul>
                </div>

                {/* CTA Action - Links to unified wizard */}
                <div className="pt-5">
                  <button
                    onClick={() => handleSelectPlan(plan)}
                    className={`w-full py-3 px-4 rounded-full text-xs font-extrabold transition-all shadow-sm flex items-center justify-center gap-1.5 ios-press ${
                      plan.popular
                        ? "bg-brand hover:bg-brand-hover text-white shadow-brand/20 shadow-md"
                        : plan.vipExclusive
                        ? "bg-amber-600 hover:bg-amber-700 text-white"
                        : "bg-black hover:bg-zinc-800 text-white"
                    }`}
                  >
                    <span>{plan.id === "free" ? "Ücretsiz Dükkanını Aç" : "Bu Paketle Dükkanını Aç"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Comparison Table */}
        <div className="bg-white rounded-ios-card border border-black/[0.04] p-6 sm:p-8 space-y-4 shadow-ios-card overflow-x-auto">
          <h3 className="font-extrabold text-base text-black">
            Tüm Özelliklerin Karşılaştırması
          </h3>

          <table className="w-full text-left text-xs border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-black/[0.06] text-zinc-400 font-bold uppercase text-[10px]">
                <th className="py-3 px-3">Özellik / Kapsam</th>
                <th className="py-3 px-3">Mahalleli (0 TL)</th>
                <th className="py-3 px-3">Vitrin (349 TL)</th>
                <th className="py-3 px-3 text-brand">Usta Pro (799 TL)</th>
                <th className="py-3 px-3 text-amber-600">Lider VIP (1.750 TL)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] text-zinc-700">
              <tr>
                <td className="py-3 px-3 font-bold text-black">Sıralama Önceliği</td>
                <td className="py-3 px-3 text-zinc-400">Standart</td>
                <td className="py-3 px-3 font-medium">Öncelikli</td>
                <td className="py-3 px-3 font-semibold text-brand">Üst Sıralarda</td>
                <td className="py-3 px-3 font-extrabold text-amber-700">En Üst Sabit (Slot 1-2)</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-bold text-black">Fiyat Menüsü & Portföy</td>
                <td className="py-3 px-3">5 Temel Hizmet</td>
                <td className="py-3 px-3">Sınırsız Hizmet</td>
                <td className="py-3 px-3">Sınırsız + Foto Galeri</td>
                <td className="py-3 px-3">Sınırsız + Video & Vitrin</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-bold text-black">Doğrulanmış Rozeti</td>
                <td className="py-3 px-3 text-zinc-400">Yok</td>
                <td className="py-3 px-3 text-blue-700 font-bold">Mavi Rozet</td>
                <td className="py-3 px-3 text-blue-700 font-bold">Mavi Rozet</td>
                <td className="py-3 px-3 text-amber-600 font-extrabold">Altın VIP Rozet</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-bold text-black">Fiziki Dükkân Kiti</td>
                <td className="py-3 px-3 text-zinc-400">Yok</td>
                <td className="py-3 px-3">Vitrin Çıkartması (QR)</td>
                <td className="py-3 px-3 font-medium">Vitrin + Tezgâh Pleksi QR</td>
                <td className="py-3 px-3 font-bold text-black">Özel Işıklı/Metal Kit + Pleksi</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-bold text-black">Mesai Dışı WhatsApp Yanıtı</td>
                <td className="py-3 px-3 text-zinc-400">Yok</td>
                <td className="py-3 px-3 text-zinc-400">Yok</td>
                <td className="py-3 px-3">Otomatik Şablon</td>
                <td className="py-3 px-3 font-bold text-black">Özelleştirilebilir 7/24 Bot</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-bold text-black">Performans Raporu</td>
                <td className="py-3 px-3 text-zinc-400">Yok</td>
                <td className="py-3 px-3">Aylık SMS Özeti</td>
                <td className="py-3 px-3">Haftalık WhatsApp Raporu</td>
                <td className="py-3 px-3">Detaylı Rapor + Rakip/Talep Analizi</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-bold text-black">Bölge / Kategori Kotası</td>
                <td className="py-3 px-3">Sınırsız</td>
                <td className="py-3 px-3">Sınırsız</td>
                <td className="py-3 px-3">Sınırsız</td>
                <td className="py-3 px-3 font-extrabold text-amber-700 bg-amber-50/50 rounded-lg">
                  Mahalle başına sadece 1 esnaf
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
