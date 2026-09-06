"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  ChevronLeft,
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
  User,
  Upload,
  CreditCard,
  Crown,
  Zap,
  Loader2,
  Calendar
} from "lucide-react";
import { 
  updateMerchantProfile,
  checkPendingByPhone,
  approveApplication,
  getMerchantById,
  sendMerchantOtp,
  verifyMerchantOtpAndLogin,
  logoutMerchantAction,
  getCurrentMerchantSession
} from "@/app/actions/merchant";
import { getMerchantAppointmentsAction } from "@/app/actions/appointment";
import type { MerchantApplication } from "@prisma/client";
import { Merchant, ServiceItem, CategoryId } from "@/types";
import { CATEGORIES } from "@/data/categories";
import { QrWindowModal } from "@/components/merchant/QrWindowModal";
import { MerchantAppointmentsView } from "@/components/merchant/MerchantAppointmentsView";
import { EsnafcaLogo } from "@/components/brand/EsnafcaLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { formatPhoneNumber } from "@/lib/utils";

const AUTH_MERCHANT_KEY = "esnafca_logged_in_merchant_id";

function MerchantPortalContent() {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [activeMerchant, setActiveMerchant] = useState<Merchant | null>(null);

  // Login State
  const [loginStep, setLoginStep] = useState<"phone" | "otp">("phone");
  const [phoneInput, setPhoneInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [pendingNotice, setPendingNotice] = useState<MerchantApplication | null>(null);

  // Navigation tab state: "profile" | "agenda"
  const [activeTab, setActiveTab] = useState<"profile" | "agenda">("profile");
  const [pendingTodayCount, setPendingTodayCount] = useState<number>(0);

  // Editable Dashboard Form State
  const [isOpen, setIsOpen] = useState(true);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [paymentSuccessNotice, setPaymentSuccessNotice] = useState<string | null>(null);

  const refreshPendingCount = useCallback(async (merchantId: string) => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const todayStr = `${yyyy}-${mm}-${dd}`;

    try {
      const res = await getMerchantAppointmentsAction(merchantId, todayStr);
      if (res.success && Array.isArray(res.appointments)) {
        const count = res.appointments.filter((a: any) => a.status === "pending").length;
        setPendingTodayCount(count);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    setMounted(true);

    // Check payment success from redirect
    if (searchParams.get("payment_success") === "true") {
      const tier = searchParams.get("tier") || "pro";
      setPaymentSuccessNotice(`🎉 Tebrikler! Aboneliğiniz başarıyla aktifleşti ve paketiniz ${tier.toUpperCase()} olarak güncellendi.`);
    }

    // Check URL tab parameter
    const tabParam = searchParams.get("tab");
    if (tabParam === "agenda") {
      setActiveTab("agenda");
    }
    
    // Check if session exists in Cookie or local
    getCurrentMerchantSession().then(merchant => {
      if (merchant) {
        setActiveMerchant(merchant as Merchant);
        setIsOpen(merchant.isOpenNow);
        setServices(merchant.services as any);
        refreshPendingCount(merchant.id);
      } else {
        const savedMerchantId = localStorage.getItem(AUTH_MERCHANT_KEY);
        if (savedMerchantId) {
          getMerchantById(savedMerchantId).then(m => {
            if (m) {
              setActiveMerchant(m as Merchant);
              setIsOpen(m.isOpenNow);
              setServices(m.services as any);
              refreshPendingCount(m.id);
            }
          });
        }
      }
    });


    // Check URL phone parameter
    const phoneFromUrl = searchParams.get("phone");
    if (phoneFromUrl) {
      setPhoneInput(formatPhoneNumber(phoneFromUrl));
    }
  }, [searchParams, refreshPendingCount]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Phone submission -> Send WhatsApp / SMS OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setPendingNotice(null);

    const cleanPhone = phoneInput.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setLoginError("Lütfen geçerli bir telefon numarası giriniz (Örn: 0532 123 45 67).");
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await sendMerchantOtp(cleanPhone);
      if (res.success) {
        if ("application" in res && res.application) {
          setPendingNotice(res.application as any);
        } else {
          setPendingNotice(null);
        }
        setLoginStep("otp");
      } else {
        setLoginError(res.error || "Doğrulama kodu gönderilemedi.");
      }
    } catch {
      setLoginError("Bağlantı hatası oluştu.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  // 2. OTP Verification -> Login with JWT Session
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const cleanPhone = phoneInput.replace(/\D/g, "");
    if (!otpInput || otpInput.trim().length < 6) {
      setLoginError("Lütfen 6 haneli doğrulama kodunu giriniz.");
      return;
    }

    try {
      const res = await verifyMerchantOtpAndLogin(cleanPhone, otpInput.trim());
      if (res.success && "merchant" in res && res.merchant) {
        localStorage.setItem(AUTH_MERCHANT_KEY, res.merchant.id);
        setActiveMerchant(res.merchant as any);
        setIsOpen(res.merchant.isOpenNow);
        setServices(res.merchant.services as any);
        showToast(`Hoş geldiniz, ${res.merchant.masterName}!`);
      } else {
        if ("application" in res && res.application) {
          setPendingNotice(res.application as any);
        }
        setLoginError(res.error || "Kod doğrulanamadı.");
      }
    } catch {
      setLoginError("Giriş işlemi başarısız oldu.");
    }
  };

  // Logout
  const handleLogout = async () => {
    await logoutMerchantAction();
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (json.success && json.url) {
        await handleUpdateProfile("heroImage", json.url);
        showToast("Fotoğraf başarıyla yüklendi ve vitrine eklendi!");
      } else {
        alert(json.error || "Görsel yüklenemedi.");
      }
    } catch {
      alert("Yükleme sırasında bağlantı hatası oluştu.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleStartCheckout = async (tier: "pro" | "plus") => {
    setIsCheckingOut(true);
    try {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, billingInterval: "monthly" }),
      });

      const json = await res.json();
      if (json.success && json.checkoutUrl) {
        window.location.href = json.checkoutUrl;
      } else {
        alert(json.error || "Ödeme başlatılamadı.");
        setIsCheckingOut(false);
      }
    } catch {
      alert("Bağlantı hatası oluştu.");
      setIsCheckingOut(false);
    }
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

  if (!activeMerchant) {
    return (
      <div className="h-[100dvh] overflow-hidden flex flex-col bg-[#F2F2F7] dark:bg-black text-black dark:text-white transition-colors duration-200" suppressHydrationWarning>
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-black dark:bg-white text-white dark:text-black px-4 py-2.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 1. Fixed Top Header */}
        <header
          className="shrink-0 z-40 ios-blur dark:bg-black/80 border-b border-black/[0.06] dark:border-white/[0.08] transition-colors pt-safe"
          style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
        >
          <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-1 text-xs font-bold text-brand ios-press p-1.5 -ml-2 rounded-full hover:bg-black/[0.04] dark:hover:bg-white/[0.08]"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
              <span>Ana Sayfa</span>
            </Link>
            <ThemeToggle />
          </div>
        </header>

        {/* 2. Scrollable Content Container */}
        <main className="flex-1 overflow-y-auto overscroll-contain flex flex-col justify-center px-4 py-6 pb-28 sm:pb-12 touch-pan-y">
          <div className="max-w-md w-full mx-auto space-y-6" suppressHydrationWarning>
            {/* Header / Brand */}
            <div className="text-center space-y-2">
              <div className="flex justify-center pb-1">
                <EsnafcaLogo size="md" />
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-black dark:text-white tracking-tight">
                Esnaf Yönetim Portalı
              </h2>
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
                    <strong>{pendingNotice.name}</strong> başvurunuz alındı. Giriş kodunu girerek hemen panele bağlanabilirsiniz.
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
                        onClick={() => {
                          setLoginStep("phone");
                          setOtpInput("");
                          setLoginError(null);
                          setPendingNotice(null);
                        }}
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
                      placeholder="••••••"
                      className="w-full py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-black/[0.04] dark:border-white/[0.08] text-center text-xl font-extrabold tracking-widest text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                    />
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

            {/* New Shop Registration Link */}
            <div className="pt-2 text-center" suppressHydrationWarning>
              <Link
                href="/esnaf-ekle"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Yeni Bir Dükkan Kaydetmek İstiyorum</span>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F2F7] dark:bg-black pb-24 sm:pb-8 text-black dark:text-white transition-colors duration-200" suppressHydrationWarning>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-black dark:bg-white text-white dark:text-black px-4 py-2.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. AUTHENTICATED MERCHANT DASHBOARD                      */}
      {/* ======================================================== */}
      <header
        className="shrink-0 sticky top-0 z-40 ios-blur dark:bg-black/80 border-b border-black/[0.06] dark:border-white/[0.08] transition-colors pt-safe"
            style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
          >
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
            {/* iOS Segmented Navigation Tab */}
            <div className="flex p-1 rounded-2xl bg-zinc-200/80 dark:bg-zinc-800/80 backdrop-blur-md">
              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                className={`flex-1 py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all ios-press ${
                  activeTab === "profile"
                    ? "bg-white dark:bg-[#1C1C1E] text-black dark:text-white shadow-sm"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                }`}
              >
                <Store className="w-4 h-4" />
                <span>Dükkan Bilgileri</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("agenda")}
                className={`flex-1 py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all ios-press relative ${
                  activeTab === "agenda"
                    ? "bg-white dark:bg-[#1C1C1E] text-black dark:text-white shadow-sm"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                }`}
              >
                <Calendar className="w-4 h-4 text-brand" />
                <span>Randevu Ajandası</span>
                {pendingTodayCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black animate-pulse">
                    {pendingTodayCount}
                  </span>
                )}
              </button>
            </div>

            {/* View Switching: Agenda vs Profile */}
            {activeTab === "agenda" ? (
              <MerchantAppointmentsView
                merchant={activeMerchant}
                onMerchantUpdated={(updated) => {
                  setActiveMerchant(updated);
                  refreshPendingCount(updated.id);
                }}
              />
            ) : (
              <>
                {/* Payment Success Banner */}
            {paymentSuccessNotice && (
              <div className="p-4 rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 flex items-center gap-3 shadow-xs animate-in fade-in slide-in-from-top-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-xs font-bold leading-relaxed">{paymentSuccessNotice}</span>
              </div>
            )}

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
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                      Kapak Fotoğrafı
                    </label>
                    <label className="text-[10px] font-bold text-brand hover:underline cursor-pointer flex items-center gap-1">
                      <Upload className="w-3 h-3" />
                      <span>{isUploading ? "Yükleniyor..." : "Cihazdan Fotoğraf Yükle"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploading}
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    value={activeMerchant.heroImage}
                    onChange={(e) => handleUpdateProfile("heroImage", e.target.value)}
                    placeholder="https://..."
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

            {/* Randevu & Müsaitlik Parametreleri Düzenleyici */}
            <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-extrabold text-black dark:text-white flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-brand" />
                    <span>Online Randevu ve Müsaitlik Parametreleri</span>
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                    Müşterilerin dükkanınızdan randevu alma sıklığını ve aralıklarını yönetin.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab("agenda")}
                  className="px-3 py-1.5 rounded-full bg-brand/10 text-brand text-xs font-bold hover:bg-brand/20 ios-press"
                >
                  Ajandaya Git →
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {/* Slot Interval */}
                <div className="space-y-1.5 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-black/[0.04] dark:border-white/[0.06]">
                  <label className="text-[11px] font-bold text-black dark:text-white block">
                    Randevu Aralığı
                  </label>
                  <select
                    value={activeMerchant.features?.slotInterval || 30}
                    onChange={async (e) => {
                      const val = Number(e.target.value);
                      const updated = { ...activeMerchant.features, slotInterval: val };
                      setActiveMerchant({ ...activeMerchant, features: updated });
                      await updateMerchantProfile(activeMerchant.id, { features: updated });
                      showToast(`Randevu aralığı ${val} dk olarak güncellendi.`);
                    }}
                    className="w-full text-xs font-bold text-black dark:text-white bg-white dark:bg-[#1C1C1E] p-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.1] focus:outline-none focus:border-brand cursor-pointer"
                  >
                    <option value={15}>15 Dakika</option>
                    <option value={30}>30 Dakika</option>
                    <option value={45}>45 Dakika</option>
                    <option value={60}>60 Dakika</option>
                  </select>
                </div>

                {/* Buffer Time */}
                <div className="space-y-1.5 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-black/[0.04] dark:border-white/[0.06]">
                  <label className="text-[11px] font-bold text-black dark:text-white block">
                    Dinlenme / Temizlik Molası
                  </label>
                  <select
                    value={activeMerchant.features?.bufferTime ?? 5}
                    onChange={async (e) => {
                      const val = Number(e.target.value);
                      const updated = { ...activeMerchant.features, bufferTime: val };
                      setActiveMerchant({ ...activeMerchant, features: updated });
                      await updateMerchantProfile(activeMerchant.id, { features: updated });
                      showToast(`Mola süresi ${val} dk olarak güncellendi.`);
                    }}
                    className="w-full text-xs font-bold text-black dark:text-white bg-white dark:bg-[#1C1C1E] p-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.1] focus:outline-none focus:border-brand cursor-pointer"
                  >
                    <option value={0}>Mola Yok (0 dk)</option>
                    <option value={5}>5 Dakika</option>
                    <option value={10}>10 Dakika</option>
                    <option value={15}>15 Dakika</option>
                  </select>
                </div>

                {/* Max Advance Days */}
                <div className="space-y-1.5 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-black/[0.04] dark:border-white/[0.06]">
                  <label className="text-[11px] font-bold text-black dark:text-white block">
                    İleri Tarih Limiti
                  </label>
                  <select
                    value={activeMerchant.features?.maxAdvanceDays || 14}
                    onChange={async (e) => {
                      const val = Number(e.target.value);
                      const updated = { ...activeMerchant.features, maxAdvanceDays: val };
                      setActiveMerchant({ ...activeMerchant, features: updated });
                      await updateMerchantProfile(activeMerchant.id, { features: updated });
                      showToast(`İleri tarih limiti ${val} gün olarak güncellendi.`);
                    }}
                    className="w-full text-xs font-bold text-black dark:text-white bg-white dark:bg-[#1C1C1E] p-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.1] focus:outline-none focus:border-brand cursor-pointer"
                  >
                    <option value={7}>7 Gün (1 Hafta)</option>
                    <option value={14}>14 Gün (2 Hafta)</option>
                    <option value={30}>30 Gün (1 Ay)</option>
                  </select>
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
            <div className="p-5 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                    Mevcut Paketiniz
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-extrabold text-black dark:text-white uppercase">
                      {activeMerchant.tier === "plus" ? "Usta Plus" : activeMerchant.tier === "pro" ? "Esnafça Pro" : "Mahalleli (Ücretsiz)"}
                    </span>
                    {activeMerchant.tier === "plus" ? (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-0.5">
                        <Crown className="w-2.5 h-2.5" /> En Yüksek Paket
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                        Aktif
                      </span>
                    )}
                  </div>
                </div>

                <Link
                  href="/fiyatlandirma"
                  className="text-xs font-bold text-brand hover:underline"
                >
                  Tüm Paketleri İncele →
                </Link>
              </div>

              {activeMerchant.tier !== "plus" && (
                <div className="pt-2 border-t border-black/[0.04] dark:border-white/[0.06] flex flex-col sm:flex-row items-center gap-2">
                  {activeMerchant.tier !== "pro" && (
                    <button
                      disabled={isCheckingOut}
                      onClick={() => handleStartCheckout("pro")}
                      className="w-full sm:flex-1 py-2.5 px-3 rounded-2xl bg-brand text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs ios-press disabled:opacity-50"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>{isCheckingOut ? "Başlatılıyor..." : "Pro'ya Geç (390 ₺/ay)"}</span>
                    </button>
                  )}
                  <button
                    disabled={isCheckingOut}
                    onClick={() => handleStartCheckout("plus")}
                    className="w-full sm:flex-1 py-2.5 px-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-xs ios-press disabled:opacity-50"
                  >
                    <Crown className="w-3.5 h-3.5" />
                    <span>{isCheckingOut ? "Başlatılıyor..." : "Usta Plus'a Geç (890 ₺/ay)"}</span>
                  </button>
                </div>
              )}
            </div>
              </>
            )}
          </main>

          {/* QR Modal Sheet */}
          <QrWindowModal
            isOpen={isQrModalOpen}
            onClose={() => setIsQrModalOpen(false)}
            merchant={activeMerchant}
          />
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
