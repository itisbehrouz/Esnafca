"use client";

import React, { useState, useEffect, useId } from "react";
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  MapPin, 
  Phone, 
  MessageCircle, 
  ExternalLink, 
  Store, 
  Tag, 
  Crown,
  AlertTriangle,
  ImageIcon,
  Camera
} from "lucide-react";
import type { MerchantApplication } from "@prisma/client";
import { approveApplicationAction, rejectApplicationAction } from "@/app/actions/admin";

interface MerchantApplicationDrawerProps {
  application: (MerchantApplication & { servicesParsed?: any[] }) | null;
  isOpen: boolean;
  onClose: () => void;
  onApproved?: (appId: string) => void;
  onRejected?: (appId: string) => void;
}

export function MerchantApplicationDrawer({
  application,
  isOpen,
  onClose,
  onApproved,
  onRejected,
}: MerchantApplicationDrawerProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectPrompt, setShowRejectPrompt] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Keyboard shortcut listener: 'A' to approve, 'R' to reject, 'Esc' to close/cancel
  useEffect(() => {
    if (!isOpen || !application) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // If user is actively typing in a form input or textarea, don't trigger shortcuts
      const tagName = (e.target as HTMLElement)?.tagName;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tagName)) {
        if (e.key === "Escape" && showRejectPrompt) {
          e.preventDefault();
          setShowRejectPrompt(false);
        }
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        if (showRejectPrompt) {
          setShowRejectPrompt(false);
        } else {
          onClose();
        }
        return;
      }

      if ((e.key === "a" || e.key === "A") && !showRejectPrompt && application.status !== "approved") {
        e.preventDefault();
        handleApprove();
      } else if ((e.key === "r" || e.key === "R") && !showRejectPrompt && application.status !== "rejected") {
        e.preventDefault();
        setShowRejectPrompt(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, application, showRejectPrompt, onClose]);

  if (!isOpen || !application) return null;

  let services: Array<{ name: string; minPrice?: number; maxPrice?: number; popular?: boolean }> = [];
  if (Array.isArray(application.servicesParsed)) {
    services = application.servicesParsed;
  } else {
    try {
      services = JSON.parse(application.services as string) || [];
    } catch {
      services = [];
    }
  }

  const cleanPhone = (application.whatsapp || application.phone || "").replace(/\D/g, "");
  const waUrl = cleanPhone.startsWith("90")
    ? `https://wa.me/${cleanPhone}`
    : `https://wa.me/90${cleanPhone.replace(/^0/, "")}`;

  const mapsQuery = encodeURIComponent(
    `${application.name} ${application.district} ${application.city} ${application.address}`
  );
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  // Default shop preview images based on category
  const defaultCategoryImages: Record<string, string> = {
    berber: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80",
    kuafor: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80",
    terzi: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80",
    cilingir: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
    veteriner: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=800&q=80",
    tamir: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80",
  };
  const categoryKey = (application.category || "").toLowerCase();
  const shopPreviewImage = defaultCategoryImages[categoryKey] || defaultCategoryImages.berber;

  const handleApprove = async () => {
    setIsUpdating(true);
    setActionMessage(null);
    try {
      const res = await approveApplicationAction(application.id);
      if (res.success) {
        setActionMessage("Başvuru başarıyla onaylandı ve vitrine alındı.");
        onApproved?.(application.id);
        setTimeout(() => {
          onClose();
          setActionMessage(null);
        }, 1200);
      } else {
        setActionMessage("Hata: " + res.error);
      }
    } catch (err: any) {
      setActionMessage("İşlem sırasında sunucu hatası oluştu.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setIsUpdating(true);
    try {
      const res = await rejectApplicationAction(application.id, rejectReason.trim());
      if (res.success) {
        setShowRejectPrompt(false);
        onRejected?.(application.id);
        onClose();
      } else {
        setActionMessage("Hata: " + res.error);
      }
    } catch (err: any) {
      setActionMessage("Reddetme başarısız.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-8 sm:pl-16">
        <div className="w-screen max-w-xl bg-white dark:bg-[#0B1120] border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transition-all animate-in slide-in-from-right duration-200">
          {/* Top Header */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex items-center justify-between shrink-0">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  Esnaf Başvuru Dosyası
                </span>
                <span className="text-xs font-mono text-slate-400">
                  #{application.id.slice(-6).toUpperCase()}
                </span>
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                    application.status === "approved"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : application.status === "rejected"
                      ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                  }`}
                >
                  {application.status === "approved"
                    ? "Onaylandı"
                    : application.status === "rejected"
                    ? "Reddedildi"
                    : "İnceleme Bekliyor"}
                </span>
              </div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                {application.name}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              title="Kapat (ESC)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Action Message Alert */}
          {actionMessage && (
            <div className="m-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
              <span>{actionMessage}</span>
            </div>
          )}

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Card 0: Storefront Visual & Photo Inspection */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-blue-500" />
                  <span>Dükkan Vitrin Görseli & Fotoğraf Denetimi</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-500 font-semibold">
                  Görsel Doğrulandı
                </span>
              </div>

              <div className="relative rounded-xl overflow-hidden aspect-video bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <img
                  src={shopPreviewImage}
                  alt={application.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-3">
                  <div className="text-white">
                    <span className="text-[11px] font-bold block">{application.name}</span>
                    <span className="text-[10px] text-slate-300">
                      {application.city} / {application.district} · {application.neighborhood}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 1: Artisan Master & Category */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-blue-500" />
                  <span>Usta & Zanaat Bilgisi</span>
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Kayıt: {new Date(application.createdAt).toLocaleDateString("tr-TR")}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Usta Adı</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{application.masterName}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Mesleki Tecrübe</span>
                  <span className="font-mono tabular-nums font-bold text-slate-800 dark:text-slate-100">
                    {application.experienceYears ? `${application.experienceYears} Yıl` : "Belirtilmedi"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Hizmet Kategorisi</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400 uppercase">{application.category}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Tercih Edilen Paket</span>
                  <span className="inline-flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                    <Crown className="w-3 h-3" />
                    <span>{application.plan} Plan</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Contact & Direct Actions */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-500" />
                  <span>İletişim & Doğrulama Kanalları</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Telefon Numarası</span>
                  <span className="font-mono tabular-nums font-bold text-slate-800 dark:text-slate-100 block mt-0.5">
                    {application.phone}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">WhatsApp Hattı</span>
                  <span className="font-mono tabular-nums font-bold text-slate-800 dark:text-slate-100 block mt-0.5">
                    {application.whatsapp || application.phone}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors active:scale-[0.98]"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp Görüşmesi Başlat ↗</span>
                </a>
              </div>
            </div>

            {/* Card 3: Location & Physical Verification */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  <span>Dükkan Adresi & Harita Teyidi</span>
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    {application.city} / {application.district} - {application.neighborhood}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                  {application.address}
                </p>

                <div className="pt-2">
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-3 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors active:scale-[0.98]"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                    <span>Google Haritalarda Dükkanı ve Fotoğrafları İncele ↗</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Card 4: Price List & Services Breakdown */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-blue-500" />
                  <span>Şeffaf Fiyat Menüsü ({services.length} Hizmet)</span>
                </span>
              </div>

              {services.length > 0 ? (
                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                  {services.map((s, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">{s.name}</span>
                        {s.popular && (
                          <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">
                            ★ En Çok Tercih Edilen
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-mono tabular-nums font-extrabold text-blue-600 dark:text-blue-400">
                          {s.minPrice || 0} ₺ {s.maxPrice && s.maxPrice !== s.minPrice ? `- ${s.maxPrice} ₺` : ""}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic">Hizmet kalemi girilmemiş.</span>
              )}
            </div>

            {/* Rejection Prompt Inset */}
            {showRejectPrompt && (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 space-y-3 animate-in fade-in">
                <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Başvuru Reddetme Gerekçesi</span>
                </div>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Reddetme sebebini yazınız (örn: Fiyat tarifesi mahalle ortalamasının üzerinde, dükkan adresi haritada teyit edilemedi)..."
                  className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-700 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRejectPrompt(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                  >
                    Vazgeç (ESC)
                  </button>
                  <button
                    type="button"
                    disabled={!rejectReason.trim() || isUpdating}
                    onClick={handleReject}
                    className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50"
                  >
                    {isUpdating ? "İşleniyor..." : "Reddi Kesinleştir"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sticky Drawer Footer Actions */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 rounded-md bg-slate-200 dark:bg-slate-800 text-[10px] font-mono text-slate-500">
                A: Onayla
              </kbd>
              <kbd className="px-2 py-1 rounded-md bg-slate-200 dark:bg-slate-800 text-[10px] font-mono text-slate-500">
                R: Reddet
              </kbd>
            </div>

            <div className="flex items-center gap-2">
              {application.status !== "rejected" && (
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => setShowRejectPrompt(true)}
                  className="px-4 py-2 rounded-xl border border-rose-300 dark:border-rose-700/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-all disabled:opacity-50 active:scale-[0.98]"
                >
                  <span className="flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reddet</span>
                  </span>
                </button>
              )}

              {application.status !== "approved" && (
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={handleApprove}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm transition-all disabled:opacity-50 active:scale-[0.98]"
                >
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isUpdating ? "Onaylanıyor..." : "Onayla & Canlıya Al"}</span>
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
