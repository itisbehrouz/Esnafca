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
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/20 pointer-events-none" />

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

          {/* Bottom Row on Image: Live Status (Left) + Neighborhood/District (Right) */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none gap-2">
            <div className="flex items-center gap-1.5 shrink-0">
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

            <div className="flex items-center gap-1 text-[11px] font-semibold text-white/95 drop-shadow-xs truncate max-w-[60%]">
              <MapPin className="w-3 h-3 text-brand shrink-0" />
              <span className="truncate">{merchant.neighborhood}, {merchant.district}</span>
            </div>
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

      {/* Apple App Store Style Bottom Row */}
      <div className="px-4 pb-4 pt-3 flex items-center justify-between gap-3">
        <Link
          href={`/esnaf/${merchant.slug}`}
          className="space-y-0.5 flex-1 ios-press active:opacity-75 min-w-0"
        >
          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
            Şeffaf Fiyat
          </span>
          <span className="text-sm font-bold text-black dark:text-white tracking-tight block truncate">
            {merchant.minPrice} ₺ - {merchant.maxPrice} ₺
          </span>
        </Link>

        {/* Apple Store Style GET Button */}
        <a
          href={quickWhatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-[#2C2C2E] dark:hover:bg-zinc-700 text-blue-600 dark:text-blue-500 text-xs font-extrabold transition-all ios-press shrink-0 flex items-center justify-center"
          title="WhatsApp'tan Ustayla Görüş"
        >
          MESAJ
        </a>
      </div>
    </div>
  );
});
