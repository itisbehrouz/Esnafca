"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Store,
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Clock,
  MapPin,
  Image as ImageIcon,
  Phone,
  MessageCircle,
  Tag,
  Star,
  DollarSign,
  CalendarCheck,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { getAdminMerchantDetails, updateMerchantDetailsAction } from "@/app/actions/admin";
import { CATEGORIES } from "@/data/categories";
import { CITIES } from "@/data/cities";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function MerchantDeepEditorPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const merchantId = resolvedParams.id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [masterName, setMasterName] = useState("");
  const [craftTitle, setCraftTitle] = useState("");
  const [category, setCategory] = useState("berber");
  const [bio, setBio] = useState("");
  const [experienceYears, setExperienceYears] = useState(10);
  const [slug, setSlug] = useState("");
  const [tier, setTier] = useState("pro");
  const [verified, setVerified] = useState(false);

  // Contact & Location
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [city, setCity] = useState("İstanbul");
  const [district, setDistrict] = useState("Kadıköy");
  const [neighborhood, setNeighborhood] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  // Hours & Status
  const [isOpenNow, setIsOpenNow] = useState(true);
  const [weekdaysHours, setWeekdaysHours] = useState("09:00 - 19:30");
  const [saturdayHours, setSaturdayHours] = useState("09:00 - 19:00");
  const [sundayHours, setSundayHours] = useState("Kapalı");

  // Media
  const [heroImage, setHeroImage] = useState("");
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [newGalleryUrl, setNewGalleryUrl] = useState("");

  // Services CRUD
  const [services, setServices] = useState<
    Array<{
      id?: string;
      name: string;
      minPrice: number;
      maxPrice?: number | null;
      popular?: boolean;
      estimatedDuration?: string | null;
    }>
  >([]);

  const [activeTab, setActiveTab] = useState<
    "basic" | "contact" | "hours" | "media" | "services"
  >("basic");

  useEffect(() => {
    async function loadData() {
      try {
        const res = await getAdminMerchantDetails(merchantId);
        if (res.success && res.data) {
          const m = res.data;
          setName(m.name || "");
          setMasterName(m.masterName || "");
          setCraftTitle(m.craftTitle || "Mahalle Esnafı & Usta");
          setCategory(m.category || "berber");
          setBio(m.bio || "");
          setExperienceYears(m.experienceYears || 0);
          setSlug(m.slug || "");
          setTier(m.tier || "pro");
          setVerified(Boolean(m.verified));

          setPhone(m.phone || "");
          setWhatsapp(m.whatsapp || "");
          setCity(m.city || "İstanbul");
          setDistrict(m.district || "");
          setNeighborhood(m.neighborhood || "");
          setAddress(m.address || "");
          setLatitude(m.latitude ?? null);
          setLongitude(m.longitude ?? null);

          setIsOpenNow(Boolean(m.isOpenNow));
          const hours = m.workingHours || {};
          setWeekdaysHours(hours.weekdays || "09:00 - 19:30");
          setSaturdayHours(hours.saturday || "09:00 - 19:00");
          setSundayHours(hours.sunday || "Kapalı");

          setHeroImage(m.heroImage || "");
          setGalleryImages(Array.isArray(m.galleryImages) ? m.galleryImages : []);

          setServices(
            Array.isArray(m.services)
              ? m.services.map((s: any) => ({
                  id: s.id,
                  name: s.name,
                  minPrice: s.minPrice,
                  maxPrice: s.maxPrice,
                  popular: Boolean(s.popular),
                  estimatedDuration: s.estimatedDuration,
                }))
              : []
          );
        } else {
          showToast("Hata: " + (res.error || "Esnaf verisi bulunamadı."));
        }
      } catch {
        showToast("Esnaf bilgileri yüklenemedi.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [merchantId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Add Gallery Image
  const handleAddGalleryImage = () => {
    if (!newGalleryUrl.trim()) return;
    setGalleryImages([...galleryImages, newGalleryUrl.trim()]);
    setNewGalleryUrl("");
  };

  // Remove Gallery Image
  const handleRemoveGalleryImage = (index: number) => {
    setGalleryImages(galleryImages.filter((_, idx) => idx !== index));
  };

  // Add Service Item
  const handleAddService = () => {
    setServices([
      ...services,
      {
        name: "Yeni Hizmet",
        minPrice: 150,
        maxPrice: 200,
        popular: false,
        estimatedDuration: "30 dk",
      },
    ]);
  };

  // Remove Service Item
  const handleRemoveService = (index: number) => {
    setServices(services.filter((_, idx) => idx !== index));
  };

  // Update Service Field
  const handleUpdateService = (index: number, field: string, value: any) => {
    const updated = [...services];
    updated[index] = { ...updated[index], [field]: value };
    setServices(updated);
  };

  // Save All
  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name,
        masterName,
        craftTitle,
        category,
        bio,
        experienceYears: Number(experienceYears) || 0,
        phone,
        whatsapp,
        city,
        district,
        neighborhood,
        address,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        isOpenNow,
        workingHours: {
          weekdays: weekdaysHours,
          saturday: saturdayHours,
          sunday: sundayHours,
        },
        heroImage,
        galleryImages,
        services: services.map((s) => {
          const minP = Math.max(0, Number(s.minPrice) || 0);
          const rawMax = s.maxPrice !== null && s.maxPrice !== undefined ? Number(s.maxPrice) : minP;
          const maxP = Math.max(minP, isNaN(rawMax) ? minP : rawMax);
          return {
            id: s.id,
            name: s.name,
            minPrice: minP,
            maxPrice: maxP,
            popular: Boolean(s.popular),
            estimatedDuration: s.estimatedDuration,
          };
        }),
      };

      const res = await updateMerchantDetailsAction(merchantId, payload);
      if (res.success) {
        showToast("Esnaf bilgileri ve menü başarıyla kaydedildi.");
      } else {
        showToast("Hata: " + res.error);
      }
    } catch {
      showToast("Kayıt işlemi sırasında hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-xs font-mono text-slate-400">
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
        <span>Esnaf Dosyası & Fiyat Menüsü Açılıyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans select-none pb-28">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-full text-xs font-bold shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/merchants"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            title="Esnaf Listesine Geri Dön"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {name || "Esnaf Düzenleyici"}
              </h1>
              <span
                className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md ${
                  tier === "plus"
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                    : "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                }`}
              >
                {tier}
              </span>
              {verified && (
                <span className="p-1 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {masterName} · {city} / {district} · {category.toUpperCase()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {slug && (
            <Link
              href={`/esnaf/${slug}`}
              target="_blank"
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
              <span>Vitrini Aç ↗</span>
            </Link>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-[0.98]"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? "Kaydediliyor..." : "Kaydet & Yayınla"}</span>
          </button>
        </div>
      </div>

      {/* Editor Tab Navigation */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 overflow-x-auto">
        {[
          { id: "basic", label: "1. Temel Bilgiler", icon: Store },
          { id: "contact", label: "2. İletişim & Lokasyon", icon: MapPin },
          { id: "hours", label: "3. Çalışma Saatleri", icon: Clock },
          { id: "media", label: "4. Fotoğraf & Galeri", icon: ImageIcon },
          { id: "services", label: `5. Canlı Hizmet Menüsü (${services.length})`, icon: DollarSign },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                active
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        {/* TAB 1: BASIC INFORMATION */}
        {activeTab === "basic" && (
          <div className="space-y-4 max-w-2xl">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
              Dükkan & Zanaatkar Kimliği
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Dükkan / İşletme Adı *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Örn: Adem Terzi Barber's Club"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Baş Usta / Zanaatkar Adı *
                </label>
                <input
                  type="text"
                  value={masterName}
                  onChange={(e) => setMasterName(e.target.value)}
                  placeholder="Örn: Adem Usta"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Zanaat Unvanı *
                </label>
                <input
                  type="text"
                  value={craftTitle}
                  onChange={(e) => setCraftTitle(e.target.value)}
                  placeholder="Örn: Mahalle Esnafı & Usta Berber"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Hizmet Kategorisi *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.shortName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Mesleki Tecrübe (Yıl)
                </label>
                <input
                  type="number"
                  min={0}
                  max={80}
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Kalıcı URL Slug (Sistem Üretimi)
                </label>
                <input
                  type="text"
                  disabled
                  value={slug}
                  className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Biyografi & Hikaye
              </label>
              <textarea
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Dükkanın hikayesi, mahalledeki geçmişi ve uzmanlık alanları..."
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* TAB 2: CONTACT & LOCATION */}
        {activeTab === "contact" && (
          <div className="space-y-4 max-w-2xl">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
              İletişim Kanalları & Coğrafi Konum
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Telefon Numarası *
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0532..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  WhatsApp Hattı *
                </label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="0532..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  İl *
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CITIES.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  İlçe *
                </label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="Örn: Kadıköy"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Mahalle *
                </label>
                <input
                  type="text"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="Örn: Moda Mahallesi"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Açık Adres (Cadde, Sokak, No) *
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Cadde, sokak, kapı numarası..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Enlem (Latitude - Opsiyonel)
                </label>
                <input
                  type="number"
                  step="any"
                  value={latitude ?? ""}
                  onChange={(e) => setLatitude(e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="Örn: 41.0428"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Boylam (Longitude - Opsiyonel)
                </label>
                <input
                  type="number"
                  step="any"
                  value={longitude ?? ""}
                  onChange={(e) => setLongitude(e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="Örn: 29.0077"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: WORKING HOURS & OPEN NOW */}
        {activeTab === "hours" && (
          <div className="space-y-4 max-w-xl">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
              Çalışma Saatleri & Canlı Durum
            </h2>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
                  Dükkan Şu An Açık mı?
                </span>
                <span className="text-[11px] text-slate-500">
                  Açık işaretlendiğinde vitrinde yeşil &quot;Açık&quot; rozeti gösterilir.
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsOpenNow(!isOpenNow)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                  isOpenNow
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                {isOpenNow ? "AÇIK" : "KAPALI"}
              </button>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Hafta İçi (Pazartesi - Cuma)
                </label>
                <input
                  type="text"
                  value={weekdaysHours}
                  onChange={(e) => setWeekdaysHours(e.target.value)}
                  placeholder="09:00 - 19:30"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Cumartesi
                </label>
                <input
                  type="text"
                  value={saturdayHours}
                  onChange={(e) => setSaturdayHours(e.target.value)}
                  placeholder="09:00 - 19:00"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Pazar
                </label>
                <input
                  type="text"
                  value={sundayHours}
                  onChange={(e) => setSundayHours(e.target.value)}
                  placeholder="Kapalı"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PHOTO & GALLERY */}
        {activeTab === "media" && (
          <div className="space-y-5 max-w-2xl">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
              Medya & Vitrin Görselleri
            </h2>

            {/* Hero Image */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Kapak (Hero) Görsel URL&apos;i *
              </label>
              <input
                type="text"
                value={heroImage}
                onChange={(e) => setHeroImage(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {heroImage && (
                <div className="relative w-full h-44 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 mt-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={heroImage}
                    alt="Kapak Görseli"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-white text-[10px] font-bold">
                    Canlı Önizleme
                  </span>
                </div>
              )}
            </div>

            {/* Gallery Images */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Galeri Fotoğrafları ({galleryImages.length})
              </label>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newGalleryUrl}
                  onChange={(e) => setNewGalleryUrl(e.target.value)}
                  placeholder="Görsel URL'i yapıştırın ve ekleyin..."
                  className="flex-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddGalleryImage}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Fotoğraf Ekle</span>
                </button>
              </div>

              {galleryImages.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  {galleryImages.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 group h-28"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img}
                        alt={`Galeri ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveGalleryImage(idx)}
                        className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-rose-600 text-white opacity-90 hover:opacity-100 transition-opacity"
                        title="Fotoğrafı Kaldır"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Henüz galeri görseli eklenmedi.</p>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: SERVICE ITEMS CRUD */}
        {activeTab === "services" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                  Hizmet & Fiyat Menüsü Masası
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Esnafın vitrininde şeffaf olarak listelenecek hizmetler, fiyat aralıkları ve popüler rozetleri.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddService}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-[0.98]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Yeni Hizmet Ekle</span>
              </button>
            </div>

            <div className="space-y-3">
              {services.map((svc, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    {/* Hizmet Adı (5 cols) */}
                    <div className="sm:col-span-5">
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                        Hizmet Adı
                      </label>
                      <input
                        type="text"
                        value={svc.name}
                        onChange={(e) => handleUpdateService(idx, "name", e.target.value)}
                        placeholder="Örn: Sakal Tıraşı & Buhar"
                        className="w-full p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    {/* Min Fiyat (2 cols) */}
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                        Başlangıç / Min (₺)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={svc.minPrice ?? 0}
                        onChange={(e) =>
                          handleUpdateService(
                            idx,
                            "minPrice",
                            e.target.value === "" ? 0 : Number(e.target.value)
                          )
                        }
                        className="w-full p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    {/* Max Fiyat (2 cols) */}
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                        Tavan / Max (₺)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={svc.maxPrice ?? svc.minPrice ?? 0}
                        onChange={(e) =>
                          handleUpdateService(
                            idx,
                            "maxPrice",
                            e.target.value === "" ? null : Number(e.target.value)
                          )
                        }
                        className="w-full p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    {/* Süre (3 cols) */}
                    <div className="sm:col-span-3">
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                        Tahmini Süre
                      </label>
                      <input
                        type="text"
                        value={svc.estimatedDuration || ""}
                        onChange={(e) => handleUpdateService(idx, "estimatedDuration", e.target.value)}
                        placeholder="Örn: 45 dk"
                        className="w-full p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleUpdateService(idx, "popular", !svc.popular)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                        svc.popular
                          ? "bg-amber-500 text-white shadow-xs"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                      title="Vitrin Popüler Hizmet Rozeti"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{svc.popular ? "Popüler" : "Normal"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemoveService(idx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Hizmeti Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Save Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0B1120]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-4 shadow-2xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Esnafça HQ Derin Düzenleyici · #{merchantId.slice(-6).toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold flex items-center gap-2 shadow-md transition-all active:scale-[0.98]"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet & Yayınla"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
