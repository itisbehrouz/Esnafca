"use client";

import { useState } from "react";
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
  PenLine
} from "lucide-react";
import { Merchant } from "@/types";
import { PriceMenuList } from "@/components/merchant/PriceMenuList";
import { QrWindowModal } from "@/components/merchant/QrWindowModal";
import { ShareModal } from "@/components/merchant/ShareModal";
import { generateWhatsAppUrl } from "@/lib/whatsapp";

interface MerchantDetailClientProps {
  merchant: Merchant;
}

export function MerchantDetailClient({ merchant }: MerchantDetailClientProps) {
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const defaultWhatsAppUrl = generateWhatsAppUrl(merchant);

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${merchant.name} ${merchant.address}`
  )}`;

  const claimShopUrl = `https://wa.me/905321112233?text=${encodeURIComponent(
    `Selam Esnafça Ekibi, ${merchant.name} (${merchant.city} / ${merchant.district}) dükkanının sahibiyim. Bilgilerimi güncellemek / profilimi yönetmek istiyorum.`
  )}`;

  return (
    <div className="min-h-screen bg-[#F2F2F7] pb-28">
      {/* Apple Translucent App Header */}
      <div className="sticky top-0 z-30 ios-blur border-b border-black/[0.06]">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-0.5 text-xs font-bold text-brand ios-press p-1.5 -ml-2 rounded-full hover:bg-black/[0.04]"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Geri</span>
          </Link>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsQrModalOpen(true)}
              className="p-2 rounded-full bg-black/[0.05] hover:bg-black/[0.08] text-black text-xs font-bold flex items-center gap-1.5 ios-press"
              title="Dükkan Karekodu"
            >
              <QrCode className="w-4 h-4 text-brand" />
              <span className="hidden sm:inline">Cam Karekodu</span>
            </button>

            <button
              onClick={() => setIsShareModalOpen(true)}
              className="p-2 rounded-full bg-black/[0.05] hover:bg-black/[0.08] text-black ios-press flex items-center gap-1"
              title="Paylaş"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        {/* Apple Maps Place Hero Container */}
        <div className="bg-white rounded-ios-card border border-black/[0.04] shadow-ios-card overflow-hidden">
          <div className="relative h-48 sm:h-64 w-full bg-zinc-900">
            <img
              src={merchant.heroImage}
              alt={merchant.name}
              className="w-full h-full object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

            <div className="absolute top-3 left-3 flex gap-2">
              {merchant.tier === "vip" ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-md">
                  <Crown className="w-3.5 h-3.5 fill-white" />
                  Mahalle Lideri (VIP)
                </span>
              ) : merchant.verified ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-white/95 text-black shadow-sm">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  Doğrulanmış Esnaf
                </span>
              ) : null}
            </div>

            <div className="absolute bottom-4 left-4 right-4 text-white space-y-1">
              <span className="text-xs font-medium text-white/80">
                {merchant.masterName} · {merchant.experienceYears} Yıl Deneyim
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                {merchant.name}
              </h1>
            </div>
          </div>

          {/* Quick Apple Place Action Circles */}
          <div className="p-4 border-b border-black/[0.04] grid grid-cols-3 gap-2">
            <a
              href={`tel:${merchant.phone}`}
              className="p-3 rounded-ios bg-zinc-100 hover:bg-zinc-200 flex flex-col items-center justify-center gap-1 text-center ios-press"
            >
              <Phone className="w-5 h-5 text-blue-600" />
              <span className="text-[11px] font-bold text-black">Ara</span>
            </a>

            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-ios bg-zinc-100 hover:bg-zinc-200 flex flex-col items-center justify-center gap-1 text-center ios-press"
            >
              <Navigation className="w-5 h-5 text-brand" />
              <span className="text-[11px] font-bold text-black">Yol Tarifi</span>
            </a>

            <button
              onClick={() => setIsQrModalOpen(true)}
              className="p-3 rounded-ios bg-zinc-100 hover:bg-zinc-200 flex flex-col items-center justify-center gap-1 text-center ios-press"
            >
              <QrCode className="w-5 h-5 text-emerald-600" />
              <span className="text-[11px] font-bold text-black">Vitrin QR</span>
            </button>
          </div>

          {/* Place Information Inset */}
          <div className="p-4 sm:p-5 space-y-4">
            {/* Address */}
            <div className="flex items-center gap-2 text-xs text-zinc-600">
              <MapPin className="w-4 h-4 text-brand shrink-0" />
              <span className="font-medium text-zinc-800">{merchant.address}</span>
            </div>

            {/* Transparent Price Callout */}
            <div className="p-3.5 rounded-ios bg-zinc-100/80 border border-black/[0.04] flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-black">
                  <Tag className="w-3.5 h-3.5 text-brand" />
                  <span>Şeffaf Fiyat Aralığı</span>
                </div>
                <span className="text-[11px] text-zinc-500">Standart işlemler için geçerlidir.</span>
              </div>
              <span className="text-lg font-extrabold text-black tracking-tight">
                {merchant.minPrice} ₺ - {merchant.maxPrice} ₺
              </span>
            </div>

            {/* Bio & Specialties */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Hakkında</span>
              <p className="text-xs text-zinc-700 leading-relaxed">{merchant.bio}</p>
              
              <div className="flex flex-wrap gap-1.5 pt-1">
                {merchant.specialties.map((spec) => (
                  <span
                    key={spec}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-700"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>

            {/* Working Hours */}
            <div className="p-3 rounded-ios bg-zinc-50 border border-black/[0.04] flex items-start gap-2.5 text-xs">
              <Clock className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full text-zinc-700">
                <div>
                  <span className="font-bold block text-black">Hafta İçi:</span>
                  <span>{merchant.workingHours.weekdays}</span>
                </div>
                <div>
                  <span className="font-bold block text-black">Cumartesi:</span>
                  <span>{merchant.workingHours.saturday}</span>
                </div>
                <div>
                  <span className="font-bold block text-black">Pazar:</span>
                  <span>{merchant.workingHours.sunday}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Transparent Price Menu */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-extrabold text-black">
              Şeffaf Hizmet & Fiyat Menüsü
            </h2>
            <span className="text-[11px] text-zinc-400 font-medium">
              {merchant.services.length} Hizmet
            </span>
          </div>

          <PriceMenuList merchant={merchant} />

          {/* Legal Price Disclaimer Callout */}
          <div className="p-3 rounded-ios bg-zinc-200/50 border border-black/[0.04] flex items-start gap-2 text-[11px] text-zinc-500 font-medium">
            <AlertCircle className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Fiyatlar esnaf tarafından bildirilen tahmini gösterge aralıklarıdır. Malzeme ve işçilik durumuna göre kesin fiyat ustanızla görüşülerek belirlenir.
            </p>
          </div>
        </div>

        {/* Section: Google Maps Verified Reviews */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-1">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-extrabold text-black">
                  Müşteri Değerlendirmeleri
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                  Google Doğrulamalı
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 font-medium">
                Doğrulanmış mahalle sakinlerinin Google Haritalar yorumları.
              </p>
            </div>

            <div className="flex items-center gap-1 text-xs font-extrabold text-black bg-white px-2.5 py-1 rounded-full border border-black/[0.06] shadow-xs">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{merchant.rating}</span>
              <span className="text-zinc-400 font-normal text-[11px]">({merchant.reviewCount})</span>
            </div>
          </div>

          {/* Review Cards */}
          <div className="space-y-2">
            {merchant.reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-4 rounded-ios bg-white border border-black/[0.04] shadow-sm space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-black">{rev.author}</span>
                    <span className="text-[10px] text-zinc-400">· {rev.date}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed font-medium">
                  "{rev.comment}"
                </p>
                {rev.tags && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {rev.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 100% Free Google Maps Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-2xl bg-white hover:bg-zinc-50 border border-black/[0.08] shadow-xs text-black text-xs font-bold flex items-center justify-center gap-2 transition-all ios-press text-center"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Google'daki Tüm Yorumları Oku ({merchant.reviewCount})</span>
            </a>

            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-2xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 text-xs font-bold flex items-center justify-center gap-2 transition-all ios-press text-center"
            >
              <PenLine className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Google'da Ustayla İlgili Yorum Yaz</span>
            </a>
          </div>
        </div>

        {/* Legal Notice & Takedown Footer */}
        <div className="pt-4 pb-2 text-center space-y-2">
          <div className="flex items-center justify-center gap-3 text-[11px] text-zinc-500 font-medium">
            <a
              href={claimShopUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-black underline underline-offset-2"
            >
              Bu Dükkan Benim (Sahiplen / Güncelle)
            </a>
            <span>·</span>
            <Link
              href="/gizlilik-ve-kosullar"
              className="hover:text-black underline underline-offset-2"
            >
              KVKK & Kullanım Şartları
            </Link>
          </div>
        </div>
      </div>

      {/* Apple Style Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 ios-blur border-t border-black/[0.08] p-3 sm:p-4 pb-safe shadow-ios-floating">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="hidden sm:block">
            <span className="text-[11px] text-zinc-500 block">{merchant.name}</span>
            <span className="font-extrabold text-sm text-black">
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
