"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
  Check,
  AlertCircle,
  Clock,
  MapPin,
  User
} from "lucide-react";
import { 
  loginMerchantByPhone,
  updateMerchantProfile,
  checkPendingByPhone,
  approveApplication,
  getMerchantById
} from "@/app/actions/merchant";
import type { MerchantApplication } from "@prisma/client";
import { Merchant, ServiceItem, CategoryId } from "@/types";
import { CATEGORIES } from "@/data/categories";
import { QrWindowModal } from "@/components/merchant/QrWindowModal";
import { EsnafcaLogo } from "@/components/brand/EsnafcaLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { formatPhoneNumber } from "@/lib/utils";

const AUTH_MERCHANT_KEY = "esnafca_logged_in_merchant_id";

function MerchantPortalContent() {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [activeMerchant, setActiveMerchant] = useState<Merchant | null>(null);

  // Login State
  const [loginStep, setLoginStep] = useState<"phone" | "otp">("phone");
  const [phoneInput, setPhoneInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [pendingNotice, setPendingNotice] = useState<MerchantApplication | null>(null);

  // Editable Dashboard Form State
  const [isOpen, setIsOpen] = useState(true);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    
    // Check if session exists
    const savedMerchantId = localStorage.getItem(AUTH_MERCHANT_KEY);
    if (savedMerchantId) {
      getMerchantById(savedMerchantId).then(merchant => {
        if (merchant) {
          setActiveMerchant(merchant as Merchant);
          setIsOpen(merchant.isOpenNow);
          setServices(merchant.services as any);
        } else {
          const pendingRaw = localStorage.getItem("esnafca_pending_application_data");
          if (pendingRaw) setPendingNotice(JSON.parse(pendingRaw));
        }
      });
    } else {
      const pendingRaw = localStorage.getItem("esnafca_pending_application_data");
      if (pendingRaw) setPendingNotice(JSON.parse(pendingRaw));
    }

    // Check URL phone parameter
    const phoneFromUrl = searchParams.get("phone");
    if (phoneFromUrl) {
      setPhoneInput(formatPhoneNumber(phoneFromUrl));
    }
  }, [searchParams]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Phone submission -> Send WhatsApp OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setPendingNotice(null);

    const cleanPhone = phoneInput.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setLoginError("Lütfen geçerli bir telefon numarası giriniz (Örn: 0532 123 45 67).");
      return;
    }

    // Check if merchant exists in live directory
    const liveRes = await loginMerchantByPhone(cleanPhone);
    const liveMerchant = liveRes.success ? liveRes.merchant : null;
    if (liveMerchant) {
      setIsSendingOtp(true);
      setTimeout(() => {
        setIsSendingOtp(false);
        setLoginStep("otp");
        setOtpInput("123456");
      }, 500);
      return;
    }

    // Check if merchant is in pending applications
    const pendingRes = await checkPendingByPhone(cleanPhone);
    const pending = pendingRes.success ? pendingRes.application : null;
    if (pending) {
      setPendingNotice(pending);
      setIsSendingOtp(true);
      setTimeout(() => {
        setIsSendingOtp(false);
        setLoginStep("otp");
        setOtpInput("123456");
      }, 500);
      return;
    }

    setLoginError("Bu telefon numarasına ait bir dükkan kaydı bulunamadı. Lütfen önce 'Esnaf Ol' sayfasından dükkanınızı ekleyin.");
  };

  // 2. OTP Verification -> Login
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (otpInput.trim() !== "123456" && otpInput.length < 6) {
      setLoginError("Girdiğiniz 6 haneli kod hatalı. (Test Kodu: 123456)");
      return;
    }

    const cleanPhone = phoneInput.replace(/\D/g, "");

    // 1. Check live merchants
    const liveRes = await loginMerchantByPhone(cleanPhone);
    const liveMerchant = liveRes.success ? liveRes.merchant : null;
    if (liveMerchant) {
      localStorage.setItem(AUTH_MERCHANT_KEY, liveMerchant.id);
      setActiveMerchant(liveMerchant as any);
      setIsOpen(liveMerchant.isOpenNow);
      setServices(liveMerchant.services as any);
      showToast(`Hoş geldiniz, ${liveMerchant.masterName}!`);
      return;
    }

    // 2. Check pending applications & approve into live
    const pendingRes = await checkPendingByPhone(cleanPhone);
    const pending = pendingRes.success ? pendingRes.application : null;
    if (pending) {
      alert("Başvurunuz henüz onaylanmamış. Lütfen yönetici onayını bekleyiniz.");
      return;
    }

    setLoginError("Dükkan kaydına erişilemedi.");
  };

  // 1-Tap Fast Demo Login Selector
  const handleFastDemoLogin = (merchant: Merchant) => {
    localStorage.setItem(AUTH_MERCHANT_KEY, merchant.id);
    setActiveMerchant(merchant);
    setIsOpen(merchant.isOpenNow);
    setServices(merchant.services as any);
    showToast(`Giriş yapıldı: ${merchant.name}`);
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem(AUTH_MERCHANT_KEY);
    setActiveMerchant(null);
    setLoginStep("phone");
    setPhoneInput("");
    setOtpInput("");
    setPendingNotice(null);
    showToast("Oturum kapatıldı.");
  };

  const handleToggleOpenStatus = async () => {
    if (!activeMerchant) return;
    const newStatus = !isOpen;
    setIsOpen(newStatus);
    setActiveMerchant({ ...activeMerchant, isOpenNow: newStatus });
    await updateMerchantProfile(activeMerchant.id, { isOpenNow: newStatus });
    showToast(newStatus ? "Dükkanınız AÇIK olarak güncellendi." : "Dükkanınız İZİNLİ/KAPALI olarak güncellendi.");
  };
  const handleUpdateProfile = async (field: keyof Merchant, value: any) => {
    if (!activeMerchant) return;
    setActiveMerchant({ ...activeMerchant, [field]: value });
    await updateMerchantProfile(activeMerchant.id, { [field]: value });
  };

  const handleUpdateWorkingHours = async (day: "weekdays" | "saturday" | "sunday", value: string) => {
    if (!activeMerchant) return;
    const newHours = { ...activeMerchant.workingHours, [day]: value };
    setActiveMerchant({ ...activeMerchant, workingHours: newHours });
    await updateMerchantProfile(activeMerchant.id, { workingHours: newHours });
  };

  const handlePriceChange = (serviceId: string, field: "minPrice" | "maxPrice", value: string) => {
    const num = Number(value) || 0;
    const updated = services.map((s) => (s.id === serviceId ? { ...s, [field]: num } : s));
    setServices(updated);
  };

  const handleServiceNameChange = (serviceId: string, value: string) => {
    const updated = services.map((s) => (s.id === serviceId ? { ...s, name: value } : s));
    setServices(updated);
  };

  const handleAddService = () => {
    const newService: ServiceItem = {
      id: `srv-${Date.now()}`,
      name: "Yeni Hizmet",
      minPrice: 100,
      maxPrice: 200,
    };
    setServices([...services, newService]);
  };

  const handleDeleteService = (serviceId: string) => {
    if (services.length <= 1) {
      showToast("Dükkanınızda en az 1 hizmet listelenmelidir.");
      return;
    }
    setServices(services.filter((s) => s.id !== serviceId));
  };

  const handleSaveServices = async () => {
    if (!activeMerchant) return;
    const minPrices = services.map((s) => s.minPrice);
    const maxPrices = services.map((s) => s.maxPrice || s.minPrice);

    const minPrice = minPrices.length > 0 ? Math.min(...minPrices) : 100;
    const maxPrice = maxPrices.length > 0 ? Math.max(...maxPrices) : 500;

    const res = await updateMerchantProfile(activeMerchant.id, { services: services });

    if (res && res.success) { setActiveMerchant({ ...activeMerchant, services: services }); }
  };

  if (!mounted) {
    return <div className="min-h-screen bg-[#F2F2F7] dark:bg-black" />;
  }

  return (
    <div className="min-h-screen bg-[#F2F2F7] dark:bg-black pb-28 text-black dark:text-white transition-colors duration-200" suppressHydrationWarning>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-black dark:bg-white text-white dark:text-black px-4 py-2.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. UNAUTHENTICATED: LOGIN / ACTIVATION GATEWAY           */}
      {/* ======================================================== */}
      {!activeMerchant ? (
        <div className="min-h-screen flex flex-col justify-between" suppressHydrationWarning>
          <div className="max-w-md w-full mx-auto px-4 py-8 space-y-6" suppressHydrationWarning>
            {/* Header / Brand */}
            <div className="text-center space-y-2">
              <div className="flex justify-center pb-1">
                <EsnafcaLogo size="md" />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-black dark:text-white tracking-tight">
                Esnaf Yönetim Portalı
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                Dükkanınızın canlı fiyat menüsünü düzenleyin, açık/kapalı durumunuzu değiştirin, vitrin karekodunuzu yazdırın.
              </p>
            </div>

            {/* Login Card */}
            <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] p-6 shadow-sm space-y-4" suppressHydrationWarning>
              {loginError && (
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span>{loginError}</span>
                    <div className="pt-1">
                      <Link href="/esnaf-ekle" className="text-brand underline font-bold block">
                        Dükkanınızı Eklemek İçin Tıklayın →
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {pendingNotice && (
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-medium space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Başvurunuz Onay Sürecinde</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    <strong>{pendingNotice.name}</strong> başvurunuz alındı. Giriş kodunu (123456) girerek hemen panele bağlanabilirsiniz.
                  </p>
                </div>
              )}

              {loginStep === "phone" ? (
                /* Step 1: Phone Number */
                <form onSubmit={handleSendOtp} className="space-y-3" suppressHydrationWarning>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                      Dükkan / WhatsApp Telefon Numaranız:
                    </label>
                    <div className="relative flex items-center">
                      <Phone className="absolute left-3.5 w-4 h-4 text-zinc-400 pointer-events-none" />
                      <input
                        type="tel"
                        autoComplete="off"
                        data-form-type="other"
                        data-lpignore="true"
                        suppressHydrationWarning
                        maxLength={14}
                        inputMode="numeric"
                        placeholder="0532 123 45 67"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(formatPhoneNumber(e.target.value))}
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

            {/* Fast Demo Accounts Selector */}
            <div className="space-y-2 pt-2 text-center" suppressHydrationWarning>
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                Hızlı Test Hesabı Seçin:
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {merchants.slice(0, 4).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleFastDemoLogin(m)}
                    className="p-2.5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.04] dark:border-white/[0.06] hover:border-black/20 dark:hover:border-white/20 flex items-center justify-between text-left ios-press shadow-xs"
                  >
                    <div>
                      <span className="text-xs font-bold text-black dark:text-white block">{m.name}</span>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                        {m.masterName} · {m.district} / {m.city}
                      </span>
                    </div>
                    <span className="text-[10px] font-extrabold text-brand">Hemen Gir →</span>
                  </button>
                ))}
              </div>

              <div className="pt-3">
                <Link
                  href="/esnaf-ekle"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Yeni Bir Dükkan Kaydetmek İstiyorum</span>
                </Link>
              </div>
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

              {/* Master / Shop Identity + Theme Toggle + View Live + Logout */}
              <div className="flex items-center gap-2">
                <Link
                  href={`/esnaf/${activeMerchant.slug}`}
                  target="_blank"
                  className="text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:text-black dark:hover:text-white px-2.5 py-1.5 rounded-full hover:bg-black/[0.04] dark:hover:bg-white/[0.08] ios-press flex items-center gap-1"
                >
                  <span className="hidden sm:inline">Vitrini Gör</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>

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
                role="switch"
                aria-checked={isOpen}
                onClick={handleToggleOpenStatus}
                className={`relative inline-flex h-[31px] w-[51px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ios-press ${
                  isOpen ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-[27px] w-[27px] transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    isOpen ? "translate-x-[20px]" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* 2. Dükkan Künyesi & Konum Özeti */}
            <div className="p-4 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-black dark:text-white">{activeMerchant.name}</h3>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                    {activeMerchant.masterName} · {activeMerchant.experienceYears} Yıl Deneyim
                  </span>
                </div>

                {activeMerchant.tier === "plus" ? (
                  <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    Plus Usta
                  </span>
                ) : (
                  <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    Doğrulanmış Esnaf
                  </span>
                )}
              </div>

              <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium pt-1 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-brand shrink-0" />
                <span className="truncate">{activeMerchant.neighborhood}, {activeMerchant.district} / {activeMerchant.city} — {activeMerchant.address}</span>
              </div>
            </div>

            {/* Profil Bilgileri Düzenleyici */}
            <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] p-5 space-y-4 shadow-xs">
              <div className="space-y-0.5">
                <h3 className="text-sm font-extrabold text-black dark:text-white flex items-center gap-1.5">
                  <User className="w-4 h-4 text-brand" />
                  <span>Profil Bilgileri & Saatler</span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                  Vitrin resminizi, sloganınızı ve çalışma saatlerinizi güncelleyin.
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block px-1">Kapak Fotoğrafı URL</label>
                  <input
                    type="text"
                    value={activeMerchant.heroImage}
                    onChange={(e) => handleUpdateProfile("heroImage", e.target.value)}
                    className="w-full text-xs font-medium text-black dark:text-white bg-zinc-100 dark:bg-zinc-800 focus:outline-none p-2.5 rounded-xl border border-transparent focus:border-brand transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block px-1">Kategori / Zanaat</label>
                  <select
                    value={activeMerchant.category}
                    onChange={(e) => handleUpdateProfile("category", e.target.value as CategoryId)}
                    className="w-full text-xs font-medium text-black dark:text-white bg-zinc-100 dark:bg-zinc-800 focus:outline-none p-2.5 rounded-xl border border-transparent focus:border-brand transition-colors cursor-pointer appearance-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block px-1">Kısa Slogan (Alt Başlık)</label>
                  <input
                    type="text"
                    value={activeMerchant.craftTitle}
                    onChange={(e) => handleUpdateProfile("craftTitle", e.target.value)}
                    placeholder="Örn: OTO BAKIM & MEKANİK"
                    className="w-full text-xs font-medium text-black dark:text-white bg-zinc-100 dark:bg-zinc-800 focus:outline-none p-2.5 rounded-xl border border-transparent focus:border-brand transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block px-1">Biyografi / Hakkımızda</label>
                  <textarea
                    value={activeMerchant.bio}
                    onChange={(e) => handleUpdateProfile("bio", e.target.value)}
                    rows={3}
                    className="w-full text-xs font-medium text-black dark:text-white bg-zinc-100 dark:bg-zinc-800 focus:outline-none p-2.5 rounded-xl border border-transparent focus:border-brand transition-colors resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block px-1">Hafta İçi</label>
                    <input
                      type="text"
                      value={activeMerchant.workingHours.weekdays}
                      onChange={(e) => handleUpdateWorkingHours("weekdays", e.target.value)}
                      placeholder="09:00 - 19:30"
                      className="w-full text-xs font-medium text-black dark:text-white bg-zinc-100 dark:bg-zinc-800 focus:outline-none p-2.5 rounded-xl border border-transparent focus:border-brand transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block px-1">Cumartesi</label>
                    <input
                      type="text"
                      value={activeMerchant.workingHours.saturday}
                      onChange={(e) => handleUpdateWorkingHours("saturday", e.target.value)}
                      placeholder="09:00 - 19:00"
                      className="w-full text-xs font-medium text-black dark:text-white bg-zinc-100 dark:bg-zinc-800 focus:outline-none p-2.5 rounded-xl border border-transparent focus:border-brand transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block px-1">Pazar</label>
                    <input
                      type="text"
                      value={activeMerchant.workingHours.sunday}
                      onChange={(e) => handleUpdateWorkingHours("sunday", e.target.value)}
                      placeholder="Kapalı"
                      className="w-full text-xs font-medium text-black dark:text-white bg-zinc-100 dark:bg-zinc-800 focus:outline-none p-2.5 rounded-xl border border-transparent focus:border-brand transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Fiyat Menüsü Düzenleyici */}
            <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-extrabold text-black dark:text-white flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-brand" />
                    <span>Şeffaf Fiyat Menüsü Düzenle</span>
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                    Enflasyon ve maliyet değişikliklerinde fiyatlarınızı dilediğiniz an güncelleyin.
                  </p>
                </div>

                <button
                  onClick={handleAddService}
                  className="px-3 py-1.5 rounded-full bg-brand/10 text-brand hover:bg-brand/20 text-xs font-bold flex items-center gap-1 ios-press shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Hizmet Ekle</span>
                </button>
              </div>

              {/* Service Rows */}
              <div className="space-y-2 divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                {services.map((s, idx) => (
                  <div key={s.id} className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        autoComplete="off"
                        data-form-type="other"
                        data-lpignore="true"
                        suppressHydrationWarning
                        value={s.name}
                        onChange={(e) => handleServiceNameChange(s.id, e.target.value)}
                        placeholder="Hizmet Adı"
                        className="w-full text-xs font-bold text-black dark:text-white bg-transparent focus:outline-none p-1 border-b border-transparent focus:border-brand"
                      />
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-xl">
                        <span className="text-[11px] text-zinc-400 font-medium">Min:</span>
                        <input
                          type="number"
                          autoComplete="off"
                          data-form-type="other"
                          data-lpignore="true"
                          suppressHydrationWarning
                          value={s.minPrice || ""}
                          onChange={(e) => handlePriceChange(s.id, "minPrice", e.target.value)}
                          className="w-16 text-xs font-extrabold text-black dark:text-white bg-transparent text-right focus:outline-none"
                        />
                        <span className="text-xs font-bold text-zinc-500">₺</span>
                      </div>

                    <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-xl">
                      <span className="text-[11px] text-zinc-400 font-medium">Max:</span>
                      <input
                        type="number"
                        autoComplete="off"
                        data-form-type="other"
                        data-lpignore="true"
                        suppressHydrationWarning
                        value={s.maxPrice || ""}
                        onChange={(e) => handlePriceChange(s.id, "maxPrice", e.target.value)}
                        className="w-16 text-xs font-extrabold text-black dark:text-white bg-transparent text-right focus:outline-none"
                      />
                      <span className="text-xs font-bold text-zinc-500">₺</span>
                    </div>

                      <button
                        onClick={() => handleDeleteService(s.id)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                        title="Hizmeti Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSaveServices}
                  className="w-full py-3 rounded-full bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm ios-press"
                >
                  <Check className="w-4 h-4" />
                  <span>Fiyat Değişikliklerini Canlıya Al</span>
                </button>
              </div>
            </div>

            {/* 4. Fiziki Karekod Standı & Çıktı */}
            <div className="p-5 rounded-3xl bg-zinc-900 text-white space-y-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-brand uppercase tracking-wider block">
                  Fiziki Vitrin & Masa Standı
                </span>
                <h3 className="text-sm font-extrabold text-white">
                  Dükkanınıza Özel Karekod Kiti
                </h3>
                <p className="text-xs text-zinc-400 font-medium leading-relaxed max-w-md">
                  Müşterilerinizin tezgahınızda veya camınızda okutabileceği şık Apple formatında şeffaf fiyat karekod kitini görüntüleyin.
                </p>
              </div>

              <button
                onClick={() => setIsQrModalOpen(true)}
                className="px-4 py-2.5 rounded-full bg-white text-black text-xs font-bold flex items-center justify-center gap-1.5 ios-press shadow-xs shrink-0"
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

          {/* QR Modal Sheet */}
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

export default function MerchantPortalPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F2F2F7] dark:bg-black" />}>
      <MerchantPortalContent />
    </Suspense>
  );
}
