"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { 
  ChevronLeft, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Sparkles, 
  ShieldCheck, 
  Crown, 
  Clock, 
  MapPin, 
  Check, 
  MessageCircle, 
  ArrowRight, 
  Navigation, 
  Store, 
  Tag, 
  ChevronDown, 
  AlertCircle 
} from "lucide-react";
import { CATEGORIES } from "@/data/categories";
import { CITIES } from "@/data/cities";
import { PRICING_PLANS, SubscriptionTierId } from "@/data/pricing-plans";
import { CategoryId } from "@/types";
import { formatNumber, formatPhoneNumber } from "@/lib/utils";
import { submitApplication } from "@/app/actions/merchant";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { getSafeCurrentPosition } from "@/lib/geolocation";

interface ServiceDraft {
  name: string;
  minPrice: string;
  maxPrice: string;
}

function EsnafEkleWizard() {
  const searchParams = useSearchParams();

  // Current Step
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const initialPlan = (searchParams.get("plan") as SubscriptionTierId) || "pro";
  const initialCycle = searchParams.get("cycle") === "monthly" ? false : true;

  const [mounted, setMounted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Step 1: Dükkan & Konum - STRICTLY EMPTY BY DEFAULT
  const [name, setName] = useState("");
  const [masterName, setMasterName] = useState("");
  const [category, setCategory] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [district, setDistrict] = useState<string>("");
  const [neighborhood, setNeighborhood] = useState<string>("");
  const [address, setAddress] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [experienceYears, setExperienceYears] = useState("");

  // GPS Auto-Fill State
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locateSuccess, setLocateSuccess] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Form Step 2: Fiyat Menüsü - Clean defaults
  const [services, setServices] = useState<ServiceDraft[]>([
    { name: "", minPrice: "", maxPrice: "" },
  ]);

  // Form Step 3: Üyelik & Paket Seçimi
  const [selectedPlanId, setSelectedPlanId] = useState<SubscriptionTierId>(initialPlan);
  const [isAnnual, setIsAnnual] = useState<boolean>(initialCycle);
  const [kvkkAccepted, setKvkkAccepted] = useState<boolean>(true);

  useEffect(() => {
    setMounted(true);
    const p = searchParams.get("plan") as SubscriptionTierId;
    if (p && ["free", "pro", "plus"].includes(p)) {
      setSelectedPlanId(p);
    }
  }, [searchParams]);

  const scrollContainerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  useEffect(() => {
    if (formError) {
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [formError]);

  // Real GPS Location Detection via Browser Geolocation (with IP Fallback)
  const handleGetLiveLocation = async () => {
    setIsLocating(true);
    setLocateSuccess(null);
    setFormError(null);

    const fallbackIp = async () => {
      try {
        const res = await fetch("/api/locate?auto=1");
        const data = await res.json();
        if (data.success && data.city && data.district) {
          setCity(data.city);
          setDistrict(data.district);
          if (data.neighborhood) setNeighborhood(data.neighborhood);
          if (data.address) setAddress(data.address);
          if (data.lat && data.lon) setCoords({ lat: data.lat, lng: data.lon });
          setLocateSuccess("Konum belirlendi: " + data.city + " / " + data.district + " - " + (data.neighborhood || ""));
          return true;
        }
      } catch {
        // ignore
      }
      return false;
    };

    try {
      const pos = await getSafeCurrentPosition({ enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 });
      const { latitude, longitude } = pos;
      setCoords({ lat: latitude, lng: longitude });
      const res = await fetch("/api/locate?lat=" + latitude + "&lon=" + longitude);
      const data = await res.json();

      if (data.success && data.city && data.district) {
        setCity(data.city);
        setDistrict(data.district);
        if (data.neighborhood) setNeighborhood(data.neighborhood);
        if (data.address) setAddress(data.address);
        setLocateSuccess("Konum tespit edildi: " + data.city + " / " + data.district + " - " + (data.neighborhood || ""));
      } else {
        setFormError("Konumunuz tam eşleştirilemedi. Lütfen listeden seçiniz.");
      }
    } catch {
      const ok = await fallbackIp();
      if (!ok) {
        setFormError("Konum bilgisi alınamadı. Lütfen şehir ve ilçenizi listeden seçiniz.");
      }
    } finally {
      setIsLocating(false);
    }
  };

  const addService = () => {
    setServices([...services, { name: "", minPrice: "", maxPrice: "" }]);
  };

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const updateService = (index: number, field: keyof ServiceDraft, val: string) => {
    const updated = [...services];
    updated[index][field] = val;
    setServices(updated);
  };

  const validateStep1 = () => {
    setFormError(null);
    if (!name.trim()) {
      setFormError("Lütfen Dükkan Adını giriniz.");
      return false;
    }
    if (!masterName.trim()) {
      setFormError("Lütfen Usta / Sahip Adını giriniz.");
      return false;
    }
    if (!category) {
      setFormError("Lütfen Zanaat / Kategori seçiniz.");
      return false;
    }
    if (!city || !district || !neighborhood) {
      setFormError("Lütfen Şehir, İlçe ve Mahalle seçiniz.");
      return false;
    }
    const cleanPhone = whatsapp.replace(/\D/g, "");
    if (cleanPhone.length !== 11 || !cleanPhone.startsWith("05")) {
      setFormError("Lütfen geçerli bir cep telefonu giriniz (Örn: 0532 123 45 67).");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep1()) {
      setStep(1);
      return;
    }

    const validServices = services.filter((s) => s.name.trim() !== "");
    if (validServices.length === 0) {
      setFormError("Lütfen en az bir hizmet adı ve fiyatı giriniz.");
      setStep(2);
      return;
    }

    if (!kvkkAccepted) {
      setFormError("Lütfen KVKK Aydınlatma Metni'ni onaylayınız.");
      setStep(3);
      return;
    }

    setIsSubmitting(true);
    const result = await submitApplication({
      name,
      masterName,
      category,
      experienceYears: Number(experienceYears) || 10,
      city,
      district,
      neighborhood,
      address: address.trim() ? address : `${neighborhood}, ${district} / ${city}`,
      latitude: coords?.lat,
      longitude: coords?.lng,
      phone: whatsapp,
      whatsapp: whatsapp.replace(/\D/g, "").startsWith("90")
        ? whatsapp.replace(/\D/g, "")
        : `90${whatsapp.replace(/\D/g, "")}`,
      plan: selectedPlanId,
      services: validServices.map((s) => ({
        name: s.name,
        minPrice: s.minPrice || "100",
        maxPrice: s.maxPrice || s.minPrice || "200",
      })),
    });
    setIsSubmitting(false);

    if (result.success) {
      setIsSubmitted(true);
    } else {
      alert("Kayıt sırasında bir hata oluştu.");
    }
  };

  const currentCityObj = CITIES.find((c) => c.name === city);
  const availableDistricts = currentCityObj ? currentCityObj.districts : [];
  const currentDistrictObj = availableDistricts.find((d) => d.name === district);
  const availableNeighborhoods = currentDistrictObj ? currentDistrictObj.neighborhoods : [];

  const selectedPlanObj = PRICING_PLANS.find((p) => p.id === selectedPlanId) || PRICING_PLANS[1];

  const generateActivationWhatsAppUrl = () => {
    const cycleText = isAnnual ? "Yıllık Peşin (%30 İndirimli)" : "Aylık";
    const priceText = isAnnual
      ? `${formatNumber(selectedPlanObj.annualPrice)} TL/yıl`
      : `${formatNumber(selectedPlanObj.monthlyPrice)} TL/ay`;

    let msg = `Selam Esnafça Ekibi! \n\n`;
    msg += `Dükkanımı Esnafça'ya kaydettim ve yayına almak istiyorum:\n\n`;
    msg += ` *Dükkan:* ${name || "İşletmem"}\n`;
    msg += ` *Usta:* ${masterName || "Usta"}\n`;
    msg += ` *Konum:* ${city} / ${district} - ${neighborhood}\n`;
    msg += ` *WhatsApp:* ${whatsapp}\n`;
    msg += ` *Seçilen Paket:* ${selectedPlanObj.name} [${cycleText} - ${priceText}]\n\n`;
    msg += `Vitrin onayımı ve karekod kiti teslimatımı başlatabilir misiniz? Teşekkürler!`;

    return `https://wa.me/905321112233?text=${encodeURIComponent(msg)}`;
  };

  if (!mounted) {
    return <div className="min-h-screen bg-[#F2F2F7] dark:bg-black" />;
  }

  return (
    <div className="h-[100dvh] overflow-hidden flex flex-col bg-[#F2F2F7] dark:bg-black text-black dark:text-white transition-colors duration-200" suppressHydrationWarning>
      {/* 1. Fixed Top Header */}
      <header
        className="shrink-0 z-40 ios-blur dark:bg-black/80 border-b border-black/[0.06] dark:border-white/[0.08] transition-colors pt-safe"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-0.5 text-xs font-bold text-brand ios-press p-1.5 -ml-2 rounded-full hover:bg-black/[0.04] dark:hover:bg-white/[0.08]"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Vazgeç</span>
          </Link>
          <h1 className="font-extrabold text-sm text-black dark:text-white">
            Dükkan Başvuru Formu
          </h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {!isSubmitted && (
              <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500">
                {step}/3
              </span>
            )}
          </div>
        </div>
      </header>

      {/* 2. Fixed Step Segmented Navigation Controller */}
      {!isSubmitted && (
        <div className="shrink-0 z-30 bg-[#F2F2F7]/95 dark:bg-black/95 backdrop-blur-md border-b border-black/[0.04] dark:border-white/[0.06]">
          <div className="max-w-2xl mx-auto px-4 py-2.5">
            <div className="grid grid-cols-3 gap-1 p-1 bg-black/[0.05] dark:bg-white/[0.08] rounded-full text-center">
              <button
                type="button"
                onClick={() => setStep(1)}
                className={`py-1.5 rounded-full text-[11px] font-bold transition-all ios-press ${
                  step === 1 ? "bg-white dark:bg-[#1C1C1E] text-black dark:text-white shadow-xs" : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                1. Dükkan & Konum
              </button>
              <button
                type="button"
                onClick={() => {
                  if (validateStep1()) setStep(2);
                }}
                className={`py-1.5 rounded-full text-[11px] font-bold transition-all ios-press ${
                  step === 2 ? "bg-white dark:bg-[#1C1C1E] text-black dark:text-white shadow-xs" : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                2. Fiyat Menüsü
              </button>
              <button
                type="button"
                onClick={() => {
                  if (validateStep1()) setStep(3);
                }}
                className={`py-1.5 rounded-full text-[11px] font-bold transition-all ios-press ${
                  step === 3 ? "bg-white dark:bg-[#1C1C1E] text-black dark:text-white shadow-xs" : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                3. Paket Seçimi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Dedicated Scrollable Content Container */}
      <main
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-28 sm:pb-12 touch-pan-y"
      >
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Value Proposition Capsule */}
          {!isSubmitted && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/20 dark:border-emerald-800/40 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h3 className="font-extrabold text-xs text-emerald-950 dark:text-emerald-200">
                  %0 Komisyon · Doğrudan Müşteri WhatsApp Hattı
                </h3>
                <p className="text-[11px] text-emerald-900/80 dark:text-emerald-300/80 leading-relaxed font-medium">
                  Cironuzdan pay alınmaz. Dükkanınızı ekleyin, mahallenizin güvenilir ustası olarak öne çıkın.
                </p>
              </div>
            </div>
          )}

          {/* Validation Error Alert */}
          {formError && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {isSubmitted ? (
            /* Step 4: Success / Activation View */
            <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] p-6 sm:p-8 text-center space-y-5 shadow-xs animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold border border-emerald-200 dark:border-emerald-800">
                  <Sparkles className="w-3.5 h-3.5" /> Başvurunuz Alındı
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-black dark:text-white tracking-tight">
                  Tebrikler {masterName || "Ustam"}!
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed font-medium">
                  <strong>{name}</strong> ({city} / {district}) dükkanınız ve <strong>{selectedPlanObj.name}</strong> paketiniz sisteme tanımlandı.
                </p>
              </div>

              {/* Selected Plan Details Callout */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-black/[0.04] dark:border-white/[0.06] max-w-md mx-auto text-left space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold text-black dark:text-white border-b border-black/[0.04] dark:border-white/[0.06] pb-2">
                  <span>Seçilen Paket:</span>
                  <span className="text-brand">{selectedPlanObj.name}</span>
                </div>
                <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-300">
                  <span>Fiziki Kit Durumu:</span>
                  <span className="font-semibold text-black dark:text-white">{selectedPlanObj.features.physicalKit}</span>
                </div>
                <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-300">
                  <span>WhatsApp Hattınız:</span>
                  <span className="font-semibold text-black dark:text-white">{whatsapp}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
                <Link
                  href={`/dukkanim?phone=${encodeURIComponent(whatsapp)}`}
                  className="flex-1 py-3 px-5 rounded-full bg-brand hover:bg-brand-hover text-white text-xs font-extrabold transition-all shadow-sm flex items-center justify-center gap-1.5 ios-press"
                >
                  <Store className="w-4 h-4" />
                  <span>Dükkanım Paneline Git</span>
                </Link>

                <a
                  href={generateActivationWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 px-5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 ios-press"
                >
                  <MessageCircle className="w-4 h-4 fill-white/20" />
                  <span>WhatsApp Onayı</span>
                </a>
              </div>
            </div>
          ) : (
            /* Multi-Step Apple Form */
            <form onSubmit={handleSubmit} className="space-y-4" suppressHydrationWarning>

            {/* ================= STEP 1: DÜKKAN & KONUM ================= */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in duration-150" suppressHydrationWarning>
                {/* Inset Group 1: Temel Bilgiler */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-3">
                    Dükkan & Usta Bilgileri
                  </span>
                  <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-black/[0.06] dark:border-white/[0.08] shadow-xs divide-y divide-black/[0.04] dark:divide-white/[0.06] overflow-hidden">
                    <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <label className="text-xs font-bold text-black dark:text-white min-w-[130px]">Dükkan Adı *</label>
                      <input
                        type="text"
                        required
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        data-form-type="other"
                        data-lpignore="true"
                        suppressHydrationWarning
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Örn: Kadıköy Usta Terzi"
                        className="w-full text-xs font-medium text-black dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none bg-transparent"
                      />
                    </div>

                    <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <label className="text-xs font-bold text-black dark:text-white min-w-[130px]">Usta / Sahip Adı *</label>
                      <input
                        type="text"
                        required
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        data-form-type="other"
                        data-lpignore="true"
                        suppressHydrationWarning
                        value={masterName}
                        onChange={(e) => setMasterName(e.target.value)}
                        placeholder="Örn: Hasan Usta"
                        className="w-full text-xs font-medium text-black dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none bg-transparent"
                      />
                    </div>

                    <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <label className="text-xs font-bold text-black dark:text-white min-w-[130px]">Zanaat / Kategori *</label>
                      <div className="relative w-full">
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className={`w-full text-xs font-bold bg-transparent focus:outline-none appearance-none cursor-pointer pr-6 ${
                            category ? "text-black dark:text-white" : "text-zinc-400 dark:text-zinc-500 font-normal"
                          }`}
                        >
                          <option value="" disabled className="dark:bg-[#1C1C1E]">Zanaat / Kategori Seçiniz...</option>
                          {CATEGORIES.map((cat) => (
                            <option key={cat.id} value={cat.id} className="text-black dark:text-white dark:bg-[#1C1C1E]">
                              {cat.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
                      </div>
                    </div>

                    <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <label className="text-xs font-bold text-black dark:text-white min-w-[130px]">Deneyim Yılı</label>
                      <input
                        type="number"
                        autoComplete="off"
                        suppressHydrationWarning
                        value={experienceYears}
                        onChange={(e) => setExperienceYears(e.target.value)}
                        placeholder="Örn: 15"
                        className="w-full text-xs font-medium text-black dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Inset Group 2: Konum & Adres */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between px-3">
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                      Adres & Konum
                    </span>
                    <button
                      type="button"
                      onClick={handleGetLiveLocation}
                      disabled={isLocating}
                      className="text-[11px] font-bold text-brand hover:underline flex items-center gap-1 ios-press"
                    >
                      <Navigation className={`w-3 h-3 ${isLocating ? "animate-spin" : ""}`} />
                      <span>{isLocating ? "Konum Alınıyor..." : "GPS ile Otomatik Doldur"}</span>
                    </button>
                  </div>

                  {locateSuccess && (
                    <div className="px-3 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>{locateSuccess}</span>
                    </div>
                  )}

                  <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-black/[0.06] dark:border-white/[0.08] shadow-xs divide-y divide-black/[0.04] dark:divide-white/[0.06] overflow-hidden">
                    {/* Şehir Dropdown */}
                    <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <label className="text-xs font-bold text-black dark:text-white min-w-[130px]">Şehir *</label>
                      <div className="relative w-full">
                        <select
                          value={city}
                          onChange={(e) => {
                            const newCity = e.target.value;
                            setCity(newCity);
                            setDistrict("");
                            setNeighborhood("");
                          }}
                          className={`w-full text-xs font-bold bg-transparent focus:outline-none appearance-none cursor-pointer pr-6 ${
                            city ? "text-black dark:text-white" : "text-zinc-400 dark:text-zinc-500 font-normal"
                          }`}
                        >
                          <option value="" disabled className="dark:bg-[#1C1C1E]">Şehir Seçiniz...</option>
                          {CITIES.map((c) => (
                            <option key={c.name} value={c.name} className="text-black dark:text-white dark:bg-[#1C1C1E]">
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* İlçe Dropdown */}
                    <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <label className="text-xs font-bold text-black dark:text-white min-w-[130px]">İlçe *</label>
                      <div className="relative w-full">
                        <select
                          value={district}
                          disabled={!city}
                          onChange={(e) => {
                            const newDist = e.target.value;
                            setDistrict(newDist);
                            setNeighborhood("");
                          }}
                          className={`w-full text-xs font-bold bg-transparent focus:outline-none appearance-none cursor-pointer pr-6 ${
                            district ? "text-black dark:text-white" : "text-zinc-400 dark:text-zinc-500 font-normal"
                          }`}
                        >
                          <option value="" disabled className="dark:bg-[#1C1C1E]">
                            {city ? "İlçe Seçiniz..." : "Önce Şehir Seçiniz"}
                          </option>
                          {availableDistricts.map((d) => (
                            <option key={d.name} value={d.name} className="text-black dark:text-white dark:bg-[#1C1C1E]">
                              {d.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Mahalle Dropdown */}
                    <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <label className="text-xs font-bold text-black dark:text-white min-w-[130px]">Mahalle *</label>
                      <div className="relative w-full">
                        <select
                          value={neighborhood}
                          disabled={!district}
                          onChange={(e) => setNeighborhood(e.target.value)}
                          className={`w-full text-xs font-bold bg-transparent focus:outline-none appearance-none cursor-pointer pr-6 ${
                            neighborhood ? "text-black dark:text-white" : "text-zinc-400 dark:text-zinc-500 font-normal"
                          }`}
                        >
                          <option value="" disabled className="dark:bg-[#1C1C1E]">
                            {district ? "Mahalle Seçiniz..." : "Önce İlçe Seçiniz"}
                          </option>
                          {availableNeighborhoods.map((nh) => (
                            <option key={nh} value={nh} className="text-black dark:text-white dark:bg-[#1C1C1E]">
                              {nh}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Açık Adres */}
                    <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <label className="text-xs font-bold text-black dark:text-white min-w-[130px]">Açık Adres</label>
                      <input
                        type="text"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        data-form-type="other"
                        data-lpignore="true"
                        suppressHydrationWarning
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Örn: Moda Cad. No: 14/B"
                        className="w-full text-xs font-medium text-black dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Inset Group 3: İletişim */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-3">
                    Müşteri WhatsApp Hattı
                  </span>
                  <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-black/[0.06] dark:border-white/[0.08] shadow-xs divide-y divide-black/[0.04] dark:divide-white/[0.06] overflow-hidden">
                    <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <label className="text-xs font-bold text-black dark:text-white min-w-[130px]">WhatsApp Numarası *</label>
                      <input
                        type="tel"
                        required
                        autoComplete="off"
                        data-form-type="other"
                        data-lpignore="true"
                        suppressHydrationWarning
                        maxLength={14}
                        inputMode="numeric"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(formatPhoneNumber(e.target.value))}
                        placeholder="0532 123 45 67"
                        className="w-full text-xs font-medium text-black dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (validateStep1()) setStep(2);
                  }}
                  className="w-full py-3.5 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm ios-press"
                >
                  <span>Devam Et: Fiyat Menüsü</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* ================= STEP 2: FİYAT MENÜSÜ ================= */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in duration-150" suppressHydrationWarning>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-3">
                    Şeffaf Hizmet & Fiyat Menüsü ({services.length} Hizmet)
                  </span>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium px-3 leading-relaxed">
                    Müşterilerin dükkanınıza gelmeden önce göreceği tahmini fiyat aralıklarını yazın.
                  </p>
                </div>

                <div className="space-y-2">
                  {services.map((srv, index) => (
                    <div
                      key={index}
                      className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-black/[0.06] dark:border-white/[0.08] p-3.5 space-y-2.5 shadow-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          required
                          autoComplete="off"
                          suppressHydrationWarning
                          value={srv.name}
                          onChange={(e) => updateService(index, "name", e.target.value)}
                          placeholder={`Hizmet ${index + 1} Adı (Örn: Paça Kısaltma)`}
                          className="w-full text-xs font-bold text-black dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none bg-zinc-100 dark:bg-zinc-800 p-2 rounded-xl"
                        />

                        {services.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeService(index)}
                            className="p-2 text-zinc-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors shrink-0"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block pb-0.5">
                            Min Fiyat (₺)
                          </label>
                          <input
                            type="number"
                            required
                            autoComplete="off"
                            suppressHydrationWarning
                            value={srv.minPrice}
                            onChange={(e) => updateService(index, "minPrice", e.target.value)}
                            placeholder="150"
                            className="w-full text-xs font-bold text-black dark:text-white focus:outline-none bg-zinc-100 dark:bg-zinc-800 p-2 rounded-xl"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block pb-0.5">
                            Maks Fiyat (₺)
                          </label>
                          <input
                            type="number"
                            required
                            autoComplete="off"
                            suppressHydrationWarning
                            value={srv.maxPrice}
                            onChange={(e) => updateService(index, "maxPrice", e.target.value)}
                            placeholder="250"
                            className="w-full text-xs font-bold text-black dark:text-white focus:outline-none bg-zinc-100 dark:bg-zinc-800 p-2 rounded-xl"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addService}
                  className="w-full py-2.5 rounded-2xl bg-white dark:bg-[#1C1C1E] hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-black/[0.06] dark:border-white/[0.08] text-xs font-bold text-black dark:text-white flex items-center justify-center gap-1.5 ios-press shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Yeni Hizmet Ekle</span>
                </button>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="py-3.5 px-5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white text-xs font-bold ios-press"
                  >
                    Geri
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const validServices = services.filter((s) => s.name.trim() !== "");
                      if (validServices.length === 0) {
                        setFormError("Lütfen en az bir hizmet adı ve fiyatı giriniz.");
                        return;
                      }
                      setFormError(null);
                      setStep(3);
                    }}
                    className="flex-1 py-3.5 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm ios-press"
                  >
                    <span>Devam Et: Paket Seçimi</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ================= STEP 3: PAKET SEÇİMİ ================= */}
            {step === 3 && (
              <div className="space-y-4 animate-in fade-in duration-150" suppressHydrationWarning>
                {/* Annual Toggle Switch */}
                <div className="p-3 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between shadow-xs">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-black dark:text-white block">Yıllık Peşin Ödeme İndirimi</span>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">%30 İndirim + Ücretsiz Karekod Cam Kiti</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAnnual(!isAnnual)}
                    className={`w-12 h-7 rounded-full transition-colors relative ios-press ${
                      isAnnual ? "bg-emerald-600" : "bg-zinc-300 dark:bg-zinc-700"
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full bg-white shadow-md block absolute top-1 transition-transform ${
                        isAnnual ? "left-6" : "left-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Plan Selection Cards */}
                <div className="space-y-2">
                  {PRICING_PLANS.map((plan) => {
                    const isSelected = selectedPlanId === plan.id;
                    const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;

                    return (
                      <div
                        key={plan.id}
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs flex items-center justify-between gap-3 ${
                          isSelected
                            ? "bg-white dark:bg-[#1C1C1E] border-brand ring-2 ring-brand/80"
                            : "bg-white dark:bg-[#1C1C1E] border-black/[0.06] dark:border-white/[0.08] hover:bg-zinc-50 dark:hover:bg-zinc-800"
                        }`}
                      >
                        <div className="space-y-0.5 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-black dark:text-white">{plan.name}</span>
                            {plan.badgeTitle && plan.badgeType !== "none" && (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                                {plan.badgeTitle}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                            {plan.tagline}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-sm font-extrabold text-black dark:text-white">
                            {price === 0 ? "Ücretsiz" : `${formatNumber(price)} ₺`}
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-normal">
                              {price > 0 ? (isAnnual ? "/yıl" : "/ay") : ""}
                            </span>
                          </div>
                          <span className={`text-[10px] font-bold ${isSelected ? "text-brand" : "text-zinc-400 dark:text-zinc-500"}`}>
                            {isSelected ? "Seçildi" : "Seç"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* KVKK & Terms Checkbox */}
                <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-xs flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="kvkk"
                    checked={kvkkAccepted}
                    onChange={(e) => setKvkkAccepted(e.target.checked)}
                    className="w-4 h-4 rounded mt-0.5 accent-brand cursor-pointer"
                  />
                  <label htmlFor="kvkk" className="text-[11px] text-zinc-600 dark:text-zinc-300 font-medium leading-relaxed cursor-pointer">
                    <Link href="/gizlilik-ve-kosullar" target="_blank" className="text-black dark:text-white font-bold underline">
                      KVKK Aydınlatma Metni
                    </Link>
                    'ni ve şeffaf fiyat taahhüdünü okudum, dükkanımın listelenmesini onaylıyorum.
                  </label>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="py-3.5 px-5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white text-xs font-bold ios-press"
                  >
                    Geri
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm ios-press"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isSubmitting ? "Gönderiliyor..." : "Başvuruyu Tamamla & WhatsApp ile Gönder"}</span>
                  </button>
                </div>
              </div>
            )}
          </form>
        )}
        </div>
      </main>
    </div>
  );
}

export default function EsnafEklePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F2F2F7] dark:bg-black" />}>
      <EsnafEkleWizard />
    </Suspense>
  );
}
