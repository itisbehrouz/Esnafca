"use client";

import React, { memo } from "react";
import Link from "next/link";
import { Star, ShieldCheck, Crown, ChevronRight, MapPin } from "lucide-react";
import { Merchant } from "@/types";
import { generateWhatsAppUrl } from "@/lib/whatsapp";

interface MerchantCardProps {
  merchant: Merchant;
}

function getOptimizedImageUrl(url: string, width = 500): string {
  if (url.includes("images.unsplash.com")) {
    const base = url.split("?")[0];
    return `${base}?auto=format&fit=crop&w=${width}&q=75`;
  }
  return url;
}

export const MerchantCard = memo(function MerchantCard({ merchant }: MerchantCardProps) {
  const quickWhatsAppUrl = generateWhatsAppUrl(merchant);
  const isPlus = merchant.tier === "plus";
  const isPro = merchant.tier === "pro";
  const optimizedImg = getOptimizedImageUrl(merchant.heroImage, 500);

  return (
    <div
      className={`group bg-white dark:bg-[#1C1C1E] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] overflow-hidden apple-card-shadow apple-card-hover transition-all duration-200 flex flex-col justify-between ${
        isPlus
          ? "ring-1 ring-amber-400/40 dark:ring-amber-400/30"
          : isPro
          ? "ring-1 ring-black/[0.08] dark:ring-white/[0.12]"
          : ""
      }`}
    >
      {/* Upper Area: Navigates to Merchant Place Detail */}
      <Link
        href={`/esnaf/${merchant.slug}`}
        className="block ios-press active:opacity-90 relative"
      >
        {/* Apple Maps Squircle Media Window */}
        <div className="relative h-44 sm:h-48 w-full bg-zinc-900 overflow-hidden">
          <img
            src={optimizedImg}
            alt={merchant.name}
            width={500}
            height={192}
            decoding="async"
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

          {/* Top Left: Tier / Verified Pill */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 pointer-events-none">
            {isPlus ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-500 text-white shadow-xs">
                <Crown className="w-3 h-3 fill-white" />
                Plus Usta
              </span>
            ) : merchant.verified ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-white/95 dark:bg-black/90 text-black dark:text-white shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Doğrulanmış
              </span>
            ) : null}
          </div>

          {/* Top Right: Google Rating Pill */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10 pointer-events-none">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md text-white text-xs font-bold shadow-xs">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{merchant.rating}</span>
              <span className="text-white/70 font-normal text-[10px]">({merchant.reviewCount})</span>
            </div>
          </div>

          {/* Bottom Left on Image: Live Status Beacon */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 pointer-events-none">
            <span className="flex h-2.5 w-2.5 relative">
              {merchant.isOpenNow && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  merchant.isOpenNow ? "bg-emerald-500" : "bg-zinc-400"
                }`}
              />
            </span>
            <span className="text-[11px] font-semibold text-white drop-shadow-xs">
              {merchant.isOpenNow ? "Şu An Açık" : "Kapalı"}
            </span>
          </div>
        </div>

        {/* Apple Place Identity Sheet Body */}
        <div className="p-4 pb-2.5 space-y-2">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-extrabold text-base text-black dark:text-white tracking-tight group-hover:text-brand dark:group-hover:text-brand transition-colors line-clamp-1">
                {merchant.name}
              </h3>
              <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-black dark:group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
            </div>

            <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-medium pt-0.5">
              <span className="text-zinc-800 dark:text-zinc-200 font-bold">{merchant.masterName}</span>
              <span>·</span>
              <span className="text-zinc-600 dark:text-zinc-400">{merchant.experienceYears} Yıl Deneyim</span>
            </div>
          </div>

          {/* Location Anchor */}
          <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
            <MapPin className="w-3.5 h-3.5 text-brand shrink-0" />
            <span className="truncate">{merchant.neighborhood}, {merchant.district}</span>
          </div>

          {/* Specialties Pills */}
          <div className="flex flex-wrap gap-1 pt-0.5">
            {merchant.specialties.slice(0, 2).map((spec) => (
              <span
                key={spec}
                className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 truncate"
              >
                {spec}
              </span>
            ))}
          </div>
        </div>
      </Link>

      {/* Bottom Row: Transparent Price & WhatsApp Icon Action Button */}
      <div className="px-4 pb-4 pt-2 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between gap-3">
        <Link
          href={`/esnaf/${merchant.slug}`}
          className="space-y-0.5 flex-1 ios-press active:opacity-75"
        >
          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
            Şeffaf Fiyat
          </span>
          <span className="text-sm sm:text-base font-extrabold text-black dark:text-white tracking-tight block">
            {merchant.minPrice} ₺ - {merchant.maxPrice} ₺
          </span>
        </Link>

        {/* 1-Tap Circular Apple Action Button with Pure WhatsApp Vector Icon */}
        <a
          href={quickWhatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 rounded-full bg-[#25D366] hover:bg-[#20bd5a] active:scale-90 text-white flex items-center justify-center shadow-xs transition-all ios-press shrink-0"
          title="WhatsApp'tan Ustayla Görüş"
          aria-label="WhatsApp"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm5.79 14.07c-.24.68-1.4 1.29-1.93 1.37-.51.08-1.18.11-1.9-.12-.44-.14-1.01-.33-1.74-.65-3.07-1.33-5.07-4.43-5.22-4.64-.15-.2-1.24-1.65-1.24-3.15 0-1.5.78-2.24 1.06-2.54.28-.3.61-.37.81-.37.2 0 .41 0 .59.01.19.01.44-.07.69.52.25.6.86 2.1.94 2.25.08.15.13.33.03.53-.1.2-.15.33-.3.51-.15.18-.32.4-.46.54-.15.15-.31.31-.13.62.18.31.8 1.32 1.72 2.14 1.18 1.05 2.17 1.38 2.48 1.53.31.15.49.13.67-.08.18-.21.78-.91.99-1.22.21-.31.42-.26.71-.15.29.11 1.83.86 2.14 1.01.31.15.52.23.6.36.08.13.08.76-.16 1.44z" />
          </svg>
        </a>
      </div>
    </div>
  );
});
