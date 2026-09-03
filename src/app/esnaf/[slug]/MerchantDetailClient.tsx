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
  ArrowLeft,
  CheckCircle2,
  X,
  MessageSquarePlus,
  Calendar
} from "lucide-react";
import { Merchant, Review } from "@/types";
import { PriceMenuList } from "@/components/merchant/PriceMenuList";
import { QrWindowModal } from "@/components/merchant/QrWindowModal";
import { ShareModal } from "@/components/merchant/ShareModal";
import { AppointmentBookingModal } from "@/components/merchant/AppointmentBookingModal";
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
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingServiceId, setBookingServiceId] = useState<string | null>(null);

  // Review Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewAuthor, setReviewAuthor] = useState("");
  const [reviewProfession, setReviewProfession] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (props.slug) {
      // First try fetching live from API
      fetch(`/api/merchants/${props.slug}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data) {
            setMerchant(json.data);
          } else {
            const found = getMerchantBySlug(props.slug!);
            if (found) setMerchant(found);
          }
        })
        .catch(() => {
          const found = getMerchantBySlug(props.slug!);
          if (found) setMerchant(found);
        });
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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchant || !reviewAuthor.trim() || !reviewComment.trim()) return;

    setIsSubmittingReview(true);
    try {
      const res = await fetch(`/api/merchants/${merchant.slug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: reviewAuthor.trim(),
          profession: reviewProfession.trim() || "Mahalle Sakini",
          rating: reviewRating,
          comment: reviewComment.trim(),
          tags: ["Doğrulanmış Deneyim"],
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        const newReview: Review = json.data;
        setMerchant({
          ...merchant,
          rating: json.newMerchantRating || merchant.rating,
          reviewCount: json.newReviewCount || merchant.reviewCount + 1,
          reviews: [newReview, ...merchant.reviews],
        });
        setIsReviewModalOpen(false);
        setReviewAuthor("");
        setReviewProfession("");
        setReviewComment("");
        setReviewRating(5);
        showToast("Yorumunuz ve puanınız başarıyla kaydedildi!");
      } else {
        alert(json.error || "Yorum kaydedilemedi.");
      }
    } catch {
      alert("Bağlantı hatası oluştu.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-[#F2F2F7] dark:bg-black pb-36 text-black dark:text-white transition-colors duration-200">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-black dark:bg-white text-white dark:text-black px-4 py-2.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Header */}
      <header className="sticky top-0 z-30 ios-blur dark:bg-black/80 border-b border-black/[0.06] dark:border-white/[0.08] transition-colors">
        <div className="max-w-4xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1 text-xs font-bold text-brand ios-press p-2 -ml-2 rounded-full hover:bg-black/[0.04] dark:hover:bg-white/[0.08]"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Mahalle Esnafları</span>
            <span className="sm:hidden">Geri</span>
          </Link>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="p-2 rounded-full hover:bg-black/[0.04] dark:hover:bg-white/[0.08] text-zinc-700 dark:text-zinc-300 ios-press"
              title="Profili Paylaş"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsQrModalOpen(true)}
              className="p-2 rounded-full hover:bg-black/[0.04] dark:hover:bg-white/[0.08] text-zinc-700 dark:text-zinc-300 ios-press"
              title="Vitrin Karekodu"
            >
              <QrCode className="w-4 h-4" />
            </button>

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        {/* 1. Merchant Identity Header Card */}
        <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-black dark:text-white">
                  {merchant.name}
                </h1>

                {merchant.tier === "plus" ? (
                  <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-500" /> Usta Plus
                  </span>
                ) : merchant.verified ? (
                  <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-blue-600 dark:text-blue-400" /> Doğrulanmış Esnaf
                  </span>
                ) : null}
              </div>

              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                {merchant.masterName} · {merchant.experienceYears} Yıllık Zanaatkar Deneyimi
              </p>
            </div>

            {/* Quick Rating & Status */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="flex items-center gap-1 font-extrabold text-sm text-black dark:text-white justify-end">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{merchant.rating > 0 ? merchant.rating.toFixed(1) : "Yeni"}</span>
                </div>
                <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
                  {merchant.reviewCount} Değerlendirme
                </span>
              </div>

              <div className="h-8 w-px bg-black/[0.06] dark:border-white/[0.08]" />

              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                merchant.isOpenNow 
                  ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400" 
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
              }`}>
                {merchant.isOpenNow ? "Şu An Açık" : "Kapalı"}
              </span>
            </div>
          </div>

          {/* Location & Bio */}
          <div className="space-y-2 pt-2 border-t border-black/[0.04] dark:border-white/[0.06]">
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

            {/* Hero Card Primary Action Row */}
            <div className="pt-3 flex flex-wrap items-center gap-2.5 border-t border-black/[0.04] dark:border-white/[0.06]">
              <button
                type="button"
                onClick={() => {
                  setBookingServiceId(null);
                  setIsBookingModalOpen(true);
                }}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-full bg-brand hover:bg-brand-hover text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm ios-press transition-all"
              >
                <Calendar className="w-4 h-4" />
                <span>Online Randevu Al</span>
              </button>

              <a
                href={defaultWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm ios-press transition-all"
              >
                <MessageCircle className="w-4 h-4 fill-white/20" />
                <span>WhatsApp ile İletişim</span>
              </a>
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
            onBookService={(svc) => {
              setBookingServiceId(svc.id);
              setIsBookingModalOpen(true);
            }}
          />
        </div>

        {/* 3. Customer Reviews & Community Feedback */}
        <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.06] pb-3">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-brand uppercase tracking-wider block">
                Mahalle Deneyimi
              </span>
              <h2 className="text-base font-extrabold text-black dark:text-white">
                Müşteri Yorumları & Puanları ({merchant.reviewCount})
              </h2>
            </div>

            <button
              onClick={() => setIsReviewModalOpen(true)}
              className="px-3.5 py-1.5 rounded-full bg-brand/10 hover:bg-brand/20 text-brand text-xs font-bold flex items-center gap-1.5 ios-press transition-colors"
            >
              <MessageSquarePlus className="w-3.5 h-3.5" />
              <span>Yorum ve Puan Bırak</span>
            </button>
          </div>

          {merchant.reviews.length > 0 ? (
            <div className="space-y-3">
              {merchant.reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-black/[0.04] dark:border-white/[0.06] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-xs text-black dark:text-white">{rev.author}</span>
                        {rev.verifiedCustomer && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300">
                            Doğrulanmış Müşteri
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                        {rev.profession || "Mahalle Sakini"} · {rev.date}
                      </span>
                    </div>

                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3 h-3 ${
                            s <= rev.rating ? "fill-amber-400 text-amber-400" : "text-zinc-300 dark:text-zinc-600"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed font-medium">
                    {rev.comment}
                  </p>

                  {rev.tags && rev.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {rev.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-black/[0.04] dark:bg-white/[0.06] text-zinc-600 dark:text-zinc-400"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center space-y-1">
              <Star className="w-6 h-6 text-zinc-300 dark:text-zinc-600 mx-auto" />
              <p className="text-xs text-zinc-400">Henüz yorum yazılmamış. İlk değerlendirmeyi siz bırakın!</p>
            </div>
          )}
        </div>

        {/* 4. Usta Claim / Portal Link Callout */}
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

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                setBookingServiceId(null);
                setIsBookingModalOpen(true);
              }}
              className="flex-1 sm:flex-initial px-6 py-3.5 rounded-full bg-brand hover:bg-brand-hover text-white text-xs font-extrabold transition-all shadow-md flex items-center justify-center gap-2 ios-press"
            >
              <Calendar className="w-4 h-4" />
              <span>Online Randevu Al</span>
            </button>

            <a
              href={defaultWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition-all shadow-md flex items-center justify-center gap-1.5 ios-press shrink-0"
              title="WhatsApp ile İletişim"
            >
              <MessageCircle className="w-4 h-4 fill-white/20" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      {/* Review Modal Sheet */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#1C1C1E] max-w-md w-full rounded-3xl p-6 border border-black/[0.08] dark:border-white/[0.1] shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
              <h3 className="text-sm font-extrabold text-black dark:text-white">
                Değerlendirme & Yorum Bırak
              </h3>
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="p-1 rounded-full text-zinc-400 hover:text-black dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                  Puanınız:
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="p-1 ios-press transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= reviewRating
                            ? "fill-amber-400 text-amber-400 scale-110"
                            : "text-zinc-300 dark:text-zinc-600"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-extrabold text-black dark:text-white ml-2">
                    {reviewRating} / 5 Yıldız
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                  Adınız & Soyadınız
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Ahmet Yılmaz"
                  value={reviewAuthor}
                  onChange={(e) => setReviewAuthor(e.target.value)}
                  className="w-full text-xs font-medium text-black dark:text-white bg-zinc-100 dark:bg-zinc-800 p-2.5 rounded-xl border border-transparent focus:border-brand focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                  Meslek / Semt (İsteğe Bağlı)
                </label>
                <input
                  type="text"
                  placeholder="Örn: Mahalle Sakini / Moda"
                  value={reviewProfession}
                  onChange={(e) => setReviewProfession(e.target.value)}
                  className="w-full text-xs font-medium text-black dark:text-white bg-zinc-100 dark:bg-zinc-800 p-2.5 rounded-xl border border-transparent focus:border-brand focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                  Deneyiminiz & Yorumunuz
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Fiyat şeffaflığı, ustanın işçiliği ve dükkan deneyiminiz hakkında..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full text-xs font-medium text-black dark:text-white bg-zinc-100 dark:bg-zinc-800 p-2.5 rounded-xl border border-transparent focus:border-brand focus:outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview || !reviewAuthor || !reviewComment}
                  className="flex-1 py-2.5 rounded-xl bg-brand text-white text-xs font-extrabold shadow-sm disabled:opacity-50"
                >
                  {isSubmittingReview ? "Kaydediliyor..." : "Yorumu Yayınla"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

      {/* Online Appointment Booking Modal */}
      <AppointmentBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          setBookingServiceId(null);
        }}
        merchant={merchant}
        preselectedServiceId={bookingServiceId}
      />
    </div>
  );
}
