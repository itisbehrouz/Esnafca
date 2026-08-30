"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Store, 
  Tag, 
  QrCode, 
  MessageCircle, 
  Sparkles, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  ExternalLink, 
  Power,
  Printer,
  Phone,
  ArrowRight,
  LogOut,
  ShieldCheck,
  Check
} from "lucide-react";
import { getAllMerchants, updateMerchant } from "@/lib/merchant-store";
import { Merchant, ServiceItem } from "@/types";
import { QrWindowModal } from "@/components/merchant/QrWindowModal";
import { EsnafcaLogo } from "@/components/brand/EsnafcaLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const AUTH_MERCHANT_KEY = "esnafca_logged_in_merchant_id";

export default function MerchantPortalPage() {
  const [mounted, setMounted] = useState(false);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [activeMerchant, setActiveMerchant] = useState<Merchant | null>(null);

  // Login State
  const [loginStep, setLoginStep] = useState<"phone" | "otp">("phone");
  const [phoneInput, setPhoneInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  // Editable Dashboard Form State
  const [isOpen, setIsOpen] = useState(true);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = () => {
    const all = getAllMerchants();
    setMerchants(all);

    // Check if session exists
    const savedMerchantId = localStorage.getItem(AUTH_MERCHANT_KEY);
    if (savedMerchantId) {
      const found = all.find((m) => m.id === savedMerchantId);
      if (found) {
        setActiveMerchant(found);
        setIsOpen(found.isOpenNow);
        setServices([...found.services]);
      }
    }
  };

  useEffect(() => {
    setMounted(true);
    loadData();
    window.addEventListener("merchants_updated", loadData);
    return () => window.removeEventListener("merchants_updated", loadData);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Phone submission -> Send WhatsApp OTP
  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const cleanPhone = phoneInput.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setLoginError("Lütfen geçerli bir 10 haneli telefon numarası girin.");
      return;
    }

    setIsSendingOtp(true);
    setTimeout(() => {
      setIsSendingOtp(false);
      setLoginStep("otp");
      setOtpInput("123456"); // Pre-filled test code for convenience
    }, 600);
  };

  // 2. OTP Verification -> Login
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (otpInput.trim() !== "123456" && otpInput.length < 6) {
      setLoginError("Girdiğiniz 6 haneli kod hatalı. (Test Kodu: 123456)");
      return;
    }

    // Match merchant by phone or pick the first matching / fallback
    const cleanPhone = phoneInput.replace(/\D/g, "");
    const matched = merchants.find(
      (m) =>
        m.phone.replace(/\D/g, "").includes(cleanPhone) ||
        m.whatsapp.includes(cleanPhone)
    ) || merchants[0]; // Fallback for testing

    if (matched) {
      localStorage.setItem(AUTH_MERCHANT_KEY, matched.id);
      setActiveMerchant(matched);
      setIsOpen(matched.isOpenNow);
      setServices([...matched.services]);
      showToast(`Hoş geldiniz, ${matched.masterName}!`);
    }
  };

  // 1-Tap Fast Demo Login Selector
  const handleFastDemoLogin = (merchant: Merchant) => {
    localStorage.setItem(AUTH_MERCHANT_KEY, merchant.id);
    setActiveMerchant(merchant);
    setIsOpen(merchant.isOpenNow);
    setServices([...merchant.services]);
    showToast(`Giriş yapıldı: ${merchant.name}`);
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem(AUTH_MERCHANT_KEY);
    setActiveMerchant(null);
    setLoginStep("phone");
    setPhoneInput("");
    setOtpInput("");
    showToast("Oturum kapatıldı.");
  };

  const handleToggleOpenStatus = () => {
    if (!activeMerchant) return;
    const newStatus = !isOpen;
    setIsOpen(newStatus);
    updateMerchant(activeMerchant.id, { isOpenNow: newStatus });
    showToast(newStatus ? "Dükkanınız AÇIK olarak güncellendi." : "Dükkanınız İZİNLİ/KAPALI olarak güncellendi.");
  };

  const handleAddService = () => {
    const newSrv: ServiceItem = {
      id: `srv-${Date.now()}`,
      name: "Yeni Hizmet",
      minPrice: 150,
      maxPrice: 250,
      popular: false,
    };
    setServices([...services, newSrv]);
  };

  const handleRemoveService = (index: number) => {
    const updated = services.filter((_, i) => i !== index);
    setServices(updated);
  };

  const handleServiceChange = (index: number, field: keyof ServiceItem, value: any) => {
    const updated = [...services];
    updated[index] = { ...updated[index], [field]: value };
    setServices(updated);
  };

  const handleSavePriceMenu = () => {
    if (!activeMerchant) return;
    const minP = Math.min(...services.map((s) => Number(s.minPrice) || 0));
    const maxP = Math.max(...services.map((s) => Number(s.maxPrice) || Number(s.minPrice) || 0));

    updateMerchant(activeMerchant.id, {
      services,
      minPrice: minP > 0 ? minP : activeMerchant.minPrice,
      maxPrice: maxP > 0 ? maxP : activeMerchant.maxPrice,
    });
    showToast("Şeffaf fiyat menünüz başarıyla kaydedildi!");
  };

  if (!mounted) {
    return <div className="min-h-screen bg-[#F2F2F7] dark:bg-black" />;
  }

  return (
    <div className="min-h-screen bg-[#F2F2F7] dark:bg-black pb-24 text-black dark:text-white transition-colors duration-200" suppressHydrationWarning>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-black dark:bg-white text-white dark:text-black px-4 py-2.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. LOGIN SCREEN (When Not Authenticated)                 */}
      {/* ======================================================== */}
      {!activeMerchant ? (
        <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8" suppressHydrationWarning>
          <div className="max-w-sm w-full space-y-4" suppressHydrationWarning>
            {/* Brand Logo & Intro */}
            <div className="text-center space-y-2">
              <div className="flex justify-center pb-1">
                <EsnafcaLogo size={52} variant="icon" />
              </div>
              <h1 className="text-xl font-extrabold text-black dark:text-white tracking-tight">
                Dükkanım Paneline Giriş
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
                Şifresiz, tek kullanımlık WhatsApp onay koduyla dükkanınızı yönetin.
              </p>
            </div>

            {/* Apple Style Login Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-sm space-y-4" suppressHydrationWarning>
              {loginError && (
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold text-center">
                  {loginError}
                </div>
              )}

              {loginStep === "phone" ? (
                /* Step 1: Phone Number */
                <form onSubmit={handleSendOtp} className="space-y-3" suppressHydrationWarning>
                  <div suppressHydrationWarning>
                    <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 block pb-1">
                      Kayıtlı WhatsApp / Cep Telefonu:
                    </label>
                    <div className="relative flex items-center" suppressHydrationWarning>
                      <Phone className="absolute left-3.5 w-4 h-4 text-zinc-400 pointer-events-none" />
                      <input
                        type="tel"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        data-form-type="other"
                        data-lpignore="true"
                        suppressHydrationWarning
                        placeholder="0532 123 45 67"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-black/[0.04] dark:border-white/[0.08] text-sm font-bold text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSendingOtp}
                    className="w-full py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-extrabold shadow-sm flex items-center justify-center gap-2 ios-press transition-all"
                  >
                    <MessageCircle className="w-4 h-4 fill-white/20" />
                    <span>{isSendingOtp ? "Kod Gönderiliyor..." : "WhatsApp ile Giriş Kodu Gönder"}</span>
                  </button>
                </form>
              ) : (
                /* Step 2: OTP Verification */
                <form onSubmit={handleVerifyOtp} className="space-y-3" suppressHydrationWarning>
                  <div className="space-y-1" suppressHydrationWarning>
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                        6 Haneli Onay Kodu:
                      </label>
                      <button
                        type="button"
                        onClick={() => setLoginStep("phone")}
                        className="text-[10px] font-bold text-brand hover:underline"
                      >
                        Numarayı Değiştir
                      </button>
                    </div>

                    <input
                      type="text"
                      maxLength={6}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      data-form-type="other"
                      data-lpignore="true"
                      suppressHydrationWarning
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value)}
                      placeholder="123456"
                      className="w-full py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-black/[0.04] dark:border-white/[0.08] text-center text-xl font-extrabold tracking-widest text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                    />
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block text-center pt-0.5">
                      Geliştirici Test Kodu: <strong>123456</strong>
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-full bg-black dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-98 text-white dark:text-black text-xs font-extrabold shadow-sm flex items-center justify-center gap-2 ios-press transition-all"
                  >
                    <Check className="w-4 h-4" />
                    <span>Panele Giriş Yap</span>
                  </button>
                </form>
              )}
            </div>

            {/* Fast Demo Accounts */}
            <div className="space-y-2 pt-2 text-center" suppressHydrationWarning>
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                Hızlı Test Hesabı Seçin:
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {merchants.slice(0, 3).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleFastDemoLogin(m)}
                    className="p-2.5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center justify-between ios-press shadow-2xs"
                  >
                    <div className="text-left">
                      <span className="block text-black dark:text-white">{m.name}</span>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-normal">{m.masterName} · {m.district}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 pt-2">
              <Link href="/" className="text-xs font-bold text-zinc-500 hover:text-black dark:hover:text-white">
                ← Ana Sayfaya Dön
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      ) : (
        /* ======================================================== */
        /* 2. AUTHENTICATED MERCHANT DASHBOARD                      */
        /* ======================================================== */
        <>
          {/* Header */}
          <header className="sticky top-0 z-30 ios-blur dark:bg-black/80 border-b border-black/[0.06] dark:border-white/[0.08] transition-colors">
            <div className="max-w-3xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Link href="/" className="font-extrabold text-base tracking-tight text-black dark:text-white flex items-center gap-1.5">
                  <span>Esnafça</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold">
                    Dükkanım
                  </span>
                </Link>
              </div>

              {/* Master / Shop Identity + Theme Toggle + Logout */}
              <div className="flex items-center gap-2">
                <div className="hidden sm:block text-right">
                  <span className="text-xs font-extrabold text-black dark:text-white block leading-none">{activeMerchant.name}</span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">{activeMerchant.masterName}</span>
                </div>

                <ThemeToggle />

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-full bg-black/[0.05] dark:bg-white/[0.08] hover:bg-rose-50 dark:hover:bg-rose-950 hover:text-rose-600 dark:hover:text-rose-400 text-zinc-600 dark:text-zinc-300 text-xs font-bold flex items-center gap-1 ios-press transition-colors"
                  title="Oturumu Kapat"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Çıkış</span>
                </button>
              </div>
            </div>
          </header>

          <main className="max-w-3xl mx-auto px-4 py-4 space-y-4">
            {/* 1. Dükkan Canlı Durum Kartı */}
            <div className="p-4 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-xs flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${isOpen ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"}`} />
                  <h2 className="text-sm font-extrabold text-black dark:text-white">
                    {isOpen ? "Dükkanınız Canlıda Açık" : "Dükkanınız İzinli / Kapalı"}
                  </h2>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                  {isOpen ? "Müşteriler şu an arama sonuçlarında sizi 'Açık' olarak görüyor." : "Arama sonuçlarında 'Kapalı' olarak gösteriliyorsunuz."}
                </p>
              </div>

              <button
                onClick={handleToggleOpenStatus}
                className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all ios-press shrink-0 flex items-center gap-1.5 ${
                  isOpen
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                    : "bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700"
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>{isOpen ? "Açık" : "Kapalı"}</span>
              </button>
            </div>

            {/* 2. Mini Performans Kartları (KPI) */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-between text-zinc-400 dark:text-zinc-500 text-[11px] font-semibold">
                  <span className="hidden sm:inline">WhatsApp Talebi</span>
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="text-xl font-extrabold text-black dark:text-white">28</div>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium block">Bu Hafta</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-between text-zinc-400 dark:text-zinc-500 text-[11px] font-semibold">
                  <span className="hidden sm:inline">Vitrin Görüntüleme</span>
                  <Store className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-xl font-extrabold text-black dark:text-white">430</div>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium block">Bu Ay</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-between text-zinc-400 dark:text-zinc-500 text-[11px] font-semibold">
                  <span className="hidden sm:inline">Cam QR Okutma</span>
                  <QrCode className="w-3.5 h-3.5 text-brand" />
                </div>
                <div className="text-xl font-extrabold text-black dark:text-white">34</div>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium block">Toplam Tarama</span>
              </div>
            </div>

            {/* 3. Şeffaf Fiyat Menüsü Düzenleyici (Live In-Place Editor) */}
            <div className="p-5 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.06] pb-3">
                <div>
                  <h3 className="font-extrabold text-base text-black dark:text-white flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-brand" />
                    <span>Şeffaf Fiyat Menüsü Düzenleyici</span>
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium pt-0.5">
                    Fiyatlarınızı buradan güncellediğinizde müşteriler doğrudan yeni fiyatları görür.
                  </p>
                </div>

                <Link
                  href={`/esnaf/${activeMerchant.slug}`}
                  target="_blank"
                  className="text-xs font-bold text-brand hover:underline flex items-center gap-1 shrink-0"
                >
                  <span>Profili Gör</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              {/* Service Items Rows */}
              <div className="space-y-2.5">
                {services.map((srv, index) => (
                  <div
                    key={srv.id || index}
                    className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-black/[0.04] dark:border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                  >
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block pb-0.5">
                        Hizmet / İşlem Adı
                      </label>
                      <input
                        type="text"
                        value={srv.name}
                        onChange={(e) => handleServiceChange(index, "name", e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-black/[0.08] dark:border-white/[0.1] text-xs font-bold text-black dark:text-white focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block pb-0.5">
                          Min (₺)
                        </label>
                        <input
                          type="number"
                          value={srv.minPrice}
                          onChange={(e) => handleServiceChange(index, "minPrice", Number(e.target.value))}
                          className="w-20 px-2.5 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-black/[0.08] dark:border-white/[0.1] text-xs font-bold text-black dark:text-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block pb-0.5">
                          Maks (₺)
                        </label>
                        <input
                          type="number"
                          value={srv.maxPrice || srv.minPrice}
                          onChange={(e) => handleServiceChange(index, "maxPrice", Number(e.target.value))}
                          className="w-20 px-2.5 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-black/[0.08] dark:border-white/[0.1] text-xs font-bold text-black dark:text-white focus:outline-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveService(index)}
                        className="p-2 text-zinc-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors mt-3"
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex items-center justify-between gap-3 border-t border-black/[0.04] dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={handleAddService}
                  className="px-4 py-2 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-bold text-black dark:text-white flex items-center gap-1.5 ios-press"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Yeni Hizmet Ekle</span>
                </button>

                <button
                  type="button"
                  onClick={handleSavePriceMenu}
                  className="px-5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm ios-press flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Fiyatları Canlıya Al</span>
                </button>
              </div>
            </div>

            {/* 4. Vitrin Karekod Kiti & Çıktı Alma */}
            <div className="p-5 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-brand" />
                  <h3 className="font-extrabold text-sm text-black dark:text-white">Dükkan Camı Karekod Kiti</h3>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed max-w-md">
                  Dükkanınızın vitrinine veya tezgahına asabileceğiniz, müşterilerin doğrudan fiyat menünüzü okutabileceği A4 baskı kiti.
                </p>
              </div>

              <button
                onClick={() => setIsQrModalOpen(true)}
                className="px-4 py-2.5 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-bold flex items-center justify-center gap-1.5 ios-press shadow-xs shrink-0"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Karekod Kitini Aç & Yazdır</span>
              </button>
            </div>

            {/* 5. Abonelik & Paket Bilgisi */}
            <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 border border-black/[0.04] dark:border-white/[0.08] flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                  Mevcut Paketiniz
                </span>
                <span className="text-xs font-extrabold text-black dark:text-white uppercase">
                  {activeMerchant.tier === "plus" ? "Usta Plus" : activeMerchant.tier === "pro" ? "Esnafça Pro" : "Mahalleli (Ücretsiz)"}
                </span>
              </div>

              <Link
                href="/fiyatlandirma"
                className="px-3.5 py-1.5 rounded-full bg-white dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-white/[0.1] text-black dark:text-white text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 ios-press"
              >
                Paketi Yükselt →
              </Link>
            </div>
          </main>

          {/* QR Window Modal */}
          <QrWindowModal
            isOpen={isQrModalOpen}
            onClose={() => setIsQrModalOpen(false)}
            merchant={activeMerchant}
          />
        </>
      )}
    </div>
  );
}
