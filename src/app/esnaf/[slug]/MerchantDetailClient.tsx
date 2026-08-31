"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ChevronLeft, 
  MapPin, 
  Phone, 
  Clock, 
  ShieldCheck, 
  Share2, 
  QrCode, 
  Star, 
  Navigation, 
  Tag, 
  Crown, 
  AlertCircle, 
  MessageCircle, 
  ExternalLink, 
  PenLine,
  Store,
  ArrowLeft
} from "lucide-react";
import { Merchant } from "@/types";
import { PriceMenuList } from "@/components/merchant/PriceMenuList";
import { QrWindowModal } from "@/components/merchant/QrWindowModal";
import { ShareModal } from "@/components/merchant/ShareModal";
import { generateWhatsAppUrl } from "@/lib/whatsapp";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { getMerchantBySlug } from "@/lib/merchant-store";

interface MerchantDetailClientProps {
  merchant?: Merchant;
  initialMerchant?: Merchant | null;
  slug?: string;
}

export function MerchantDetailClient(props: MerchantDetailClientProps) {
  const [merchant, setMerchant] = useState<Merchant | null>(
    props.merchant || props.initialMerchant || null
  );
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    if (props.slug) {
      const found = getMerchantBySlug(props.slug);
      if (found) {
        setMerchant(found);
      }
    }
    const handleUpdate = () => {
      if (props.slug) {
        const found = getMerchantBySlug(props.slug);
        if (found) setMerchant(found);
      }
    };
    window.addEventListener("merchants_updated", handleUpdate);
    return () => window.removeEventListener("merchants_updated", handleUpdate);
  }, [props.slug]);

  if (!merchant) {
    return (
      <div className="min-h-screen bg-[#F2F2F7] dark:bg-black text-black dark:text-white flex flex-col justify-between">
        <div className="sticky top-0 z-30 ios-blur dark:bg-black/80 border-b border-black/[0.06] dark:border-white/[0.08]">
          <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-0.5 text-xs font-bold text-brand ios-press p-1.5 -ml-2 rounded-full hover:bg-black/[0.04] dark:hover:bg-white/[0.08]"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
              <span>Ana Sayfa</span>
            </Link>
            <ThemeToggle />
          </div>
        </div>

        <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-400 mx-auto flex items-center justify-center">
            <Store className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold tracking-tight">Dükkan Bulunamadı</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Aradığınız esnaf profili henüz onay sürecinde olabilir veya taşınmış olabilir.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-brand text-white text-xs font-bold shadow-sm ios-press"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Mahalle Esnaflarına Dön</span>
          </Link>
        </div>

        <div className="p-4 text-center text-xs text-zinc-400">Esnafça Platformu</div>
      </div>
    );
  }

  const defaultWhatsAppUrl = generateWhatsAppUrl(merchant);
  const isPlus = merchant.tier === "plus";

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${merchant.name} ${merchant.address}`
  )}`;

  const claimShopUrl = `https://wa.me/905321112233?text=${encodeURIComponent(
    `Selam Esnafça Ekibi, ${merchant.name} (${merchant.city} / ${merchant.district}) dükkanının sahibiyim. Bilgilerimi güncellemek / profilimi yönetmek istiyorum.`
  )}`;

  return (
    <div className="min-h-screen bg-[#F2F2F7] dark:bg-black pb-28 text-black dark:text-white transition-colors duration-200">
      {/* Apple Translucent App Header */}
      <div className="sticky top-0 z-30 ios-blur dark:bg-black/80 border-b border-black/[0.06] dark:border-white/[0.08] transition-colors">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-0.5 text-xs font-bold text-brand ios-press p-1.5 -ml-2 rounded-full hover:bg-black/[0.04] dark:hover:bg-white/[0.08]"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Geri</span>
          </Link>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="p-2 rounded-full bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.12] text-black dark:text-white text-xs font-semibold flex items-center gap-1 ios-press transition-colors"
              title="Dükkanı Paylaş"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        {/* Apple Maps Hero Media Card */}
        <div className="rounded-3xl overflow-hidden bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-sm">
          {/* Hero Image Window */}
          <div className="relative h-64 sm:h-80 w-full bg-zinc-900">
            <img
              src={merchant.heroImage}
              alt={merchant.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />

            {/* Top Badges */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
              {isPlus ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500 text-white shadow-md">
                  <Crown className="w-3.5 h-3.5 fill-white" />
                  Plus Usta
                </span>
              ) : merchant.verified ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-white/95 dark:bg-black/90 text-black dark:text-white shadow-sm">
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Doğrulanmış Esnaf
                </span>
              ) : <div />}

              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md text-white text-xs font-bold shadow-sm">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{merchant.rating}</span>
                <span className="text-white/70 font-normal text-[11px]">({merchant.reviewCount} Değerlendirme)</span>
              </div>
            </div>

            {/* Bottom Title on Hero */}
            <div className="absolute bottom-4 left-4 right-4 text-white space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand block drop-shadow-xs">
                {merchant.craftTitle}
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight drop-shadow-md">
                {merchant.name}
              </h1>
              <p className="text-xs text-white/90 font-medium flex items-center gap-1.5 drop-shadow-xs">
                <span>Usta: <strong>{merchant.masterName}</strong></span>
                <span>·</span>
                <span>{merchant.experienceYears} Yıl Deneyim</span>
              </p>
            </div>
          </div>

          {/* Apple Maps Style Action Row */}
          <div className="p-4 flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.06] bg-white dark:bg-[#1C1C1E]">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 flex-1 ios-press"
            >
              <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-sm">
                <Navigation className="w-5 h-5 fill-current" />
              </div>
              <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-500">Yol Tarifi</span>
            </a>

            <a
              href={defaultWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 flex-1 ios-press"
            >
              <div className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center shadow-sm">
                <MessageCircle className="w-5 h-5 fill-current" />
              </div>
              <span className="text-[10px] font-semibold text-green-600 dark:text-green-500">Mesaj</span>
            </a>

            <button
              onClick={() => setIsQrModalOpen(true)}
              className="flex flex-col items-center gap-1.5 flex-1 ios-press"
            >
              <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 text-brand flex items-center justify-center">
                <QrCode className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400">Karekod</span>
            </button>

            <button
              onClick={() => setIsShareModalOpen(true)}
              className="flex flex-col items-center gap-1.5 flex-1 ios-press"
            >
              <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 text-brand flex items-center justify-center">
                <Share2 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400">Paylaş</span>
            </button>
          </div>

          {/* Quick Info Bar */}
          <div className="px-4 py-3 flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.06] bg-white dark:bg-[#1C1C1E]">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${merchant.isOpenNow ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"}`} />
              <span className="text-xs font-bold text-black dark:text-white">
                {merchant.isOpenNow ? "Şu An Açık" : "Kapalı"}
              </span>
            </div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              {merchant.workingHours.weekdays}
            </span>
          </div>

          {/* Location & Bio Bar */}
          <div className="p-4 sm:p-5 space-y-3">
            <div className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-300 font-medium">
              <MapPin className="w-4 h-4 text-brand shrink-0 mt-0.5" />
              <span>{merchant.address} ({merchant.neighborhood}, {merchant.district} / {merchant.city})</span>
            </div>

            {merchant.bio && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-normal pt-1 border-t border-black/[0.04] dark:border-white/[0.06]">
                {merchant.bio}
              </p>
            )}

            {/* Specialties Badges */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {merchant.specialties.map((spec) => (
                <span
                  key={spec}
                  className="text-xs font-medium px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                >
                  {spec}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Transparent Price Menu Component */}
        <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.06] pb-3">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-brand uppercase tracking-wider block">
                Şeffaf Fiyat Listesi
              </span>
              <h2 className="text-base font-extrabold text-black dark:text-white">
                İşlem ve Hizmet Tarifesi
              </h2>
            </div>
            <span className="text-xs font-extrabold text-zinc-700 dark:text-zinc-300">
              {merchant.minPrice} ₺ - {merchant.maxPrice} ₺
            </span>
          </div>

          <PriceMenuList
            services={merchant.services}
            merchant={merchant}
          />
        </div>

        {/* 3. Usta Claim / Portal Link Callout */}
        <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 border border-black/[0.04] dark:border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <span className="font-bold text-black dark:text-white">Bu dükkan sizin mi?</span>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">
              Fiyatlarınızı güncellemek ve vitrin kitinizi yönetmek için dükkan paneline bağlanın.
            </p>
          </div>

          <Link
            href={`/dukkanim?phone=${encodeURIComponent(merchant.phone)}`}
            className="px-4 py-2 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-bold shrink-0 text-center ios-press"
          >
            Dükkanımı Yönet →
          </Link>
        </div>
      </div>

      {/* Apple Style Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 ios-blur dark:bg-black/85 border-t border-black/[0.08] dark:border-white/[0.08] p-3 sm:p-4 pb-safe shadow-ios-floating transition-colors">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="hidden sm:block">
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block">{merchant.name}</span>
            <span className="font-extrabold text-sm text-black dark:text-white">
              {merchant.masterName} ile Doğrudan İletişim
            </span>
          </div>

          <a
            href={defaultWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition-all shadow-md flex items-center justify-center gap-2 ios-press"
          >
            <MessageCircle className="w-4 h-4 fill-white/20" />
            <span>WhatsApp'tan Fiyat / Randevu Al</span>
          </a>
        </div>
      </div>

      {/* QR Window Modal */}
      <QrWindowModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        merchant={merchant}
      />

      {/* Share Modal Action Sheet */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        merchant={merchant}
      />
    </div>
  );
}
