"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  Store, 
  Clock, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  Search, 
  ChevronRight, 
  Crown, 
  Sparkles, 
  MessageCircle,
  Filter,
  Send,
  Check
} from "lucide-react";
import { 
  getAllMerchants, 
  getPendingApplications, 
  approveApplication, 
  rejectApplication, 
  updateMerchant,
  MerchantApplication 
} from "@/lib/merchant-store";
import { Merchant, SubscriptionTier } from "@/types";
import { CITIES } from "@/data/cities";
import { CATEGORIES } from "@/data/categories";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"pending" | "merchants" | "finance" | "broadcast">("pending");
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [pendingApps, setPendingApps] = useState<MerchantApplication[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Broadcast state
  const [broadcastTarget, setBroadcastTarget] = useState("all");
  const [broadcastText, setBroadcastText] = useState("Değerli Esnafımız, bayram öncesi yoğunluk sebebiyle şeffaf fiyat menünüzü güncellemenizi rica ederiz.");
  const [isCopied, setIsCopied] = useState(false);

  const loadData = () => {
    setMerchants(getAllMerchants());
    setPendingApps(getPendingApplications());
  };

  useEffect(() => {
    loadData();
    window.addEventListener("merchants_updated", loadData);
    window.addEventListener("applications_updated", loadData);
    return () => {
      window.removeEventListener("merchants_updated", loadData);
      window.removeEventListener("applications_updated", loadData);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleApprove = (appId: string) => {
    const approved = approveApplication(appId);
    if (approved) {
      showToast(`Tebrikler! "${approved.name}" onaylandı ve canlıya alındı.`);
      loadData();
    }
  };

  const handleReject = (appId: string) => {
    if (confirm("Bu başvuruyu reddetmek istediğinize emin misiniz?")) {
      rejectApplication(appId);
      showToast("Başvuru reddedildi.");
      loadData();
    }
  };

  const handleTierChange = (merchantId: string, newTier: SubscriptionTier) => {
    updateMerchant(merchantId, { tier: newTier });
    showToast(`Paket ${newTier.toUpperCase()} olarak güncellendi.`);
    loadData();
  };

  const handleToggleVerified = (merchantId: string, currentStatus: boolean) => {
    updateMerchant(merchantId, { verified: !currentStatus });
    showToast(`Doğrulama durumu güncellendi.`);
    loadData();
  };

  // Financial Metrics Calculation
  const tierPrices: Record<string, number> = { free: 0, vitrin: 290, pro: 590, vip: 1290 };
  const totalMRR = merchants.reduce((acc, m) => acc + (tierPrices[m.tier] || 0), 0);
  const vipCount = merchants.filter((m) => m.tier === "vip").length;
  const proCount = merchants.filter((m) => m.tier === "pro").length;
  const vitrinCount = merchants.filter((m) => m.tier === "vitrin").length;

  const filteredMerchants = merchants.filter((m) => {
    if (selectedCity !== "all" && m.city !== selectedCity) return false;
    if (selectedCategory !== "all" && m.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.masterName.toLowerCase().includes(q) ||
        m.district.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F2F2F7] pb-24">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-black text-white px-4 py-2.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin Header */}
      <header className="sticky top-0 z-30 ios-blur border-b border-black/[0.06]">
        <div className="max-w-5xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="font-extrabold text-base tracking-tight text-black flex items-center gap-1.5">
              <span>Esnafça</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-black text-white font-bold">
                Yönetici Kokpiti
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-xs font-bold text-zinc-600 hover:text-black px-3 py-1.5 rounded-full hover:bg-black/[0.04] ios-press"
            >
              Siteye Dön ↗
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-4 space-y-4">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3.5 rounded-2xl bg-white border border-black/[0.06] shadow-xs space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-[11px] font-semibold">
              <span>Aktif Esnaf</span>
              <Store className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-black">{merchants.length}</div>
            <span className="text-[10px] text-emerald-600 font-medium">6 Büyükşehirde</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-black/[0.06] shadow-xs space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-[11px] font-semibold">
              <span>Onay Bekleyen</span>
              <Clock className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-black">{pendingApps.length}</div>
            <span className="text-[10px] text-amber-600 font-medium">Hızlı Triage Gerekli</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-black/[0.06] shadow-xs space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-[11px] font-semibold">
              <span>Tahmini MRR</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-black">
              {totalMRR.toLocaleString("tr-TR")} ₺
            </div>
            <span className="text-[10px] text-zinc-400 font-medium">Aylık Tekrarlayan</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-black/[0.06] shadow-xs space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-[11px] font-semibold">
              <span>VIP Liderler</span>
              <Crown className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-black">{vipCount} Dükkan</div>
            <span className="text-[10px] text-zinc-400 font-medium">En Yüksek Görünürlük</span>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/[0.04] border border-black/[0.04] overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("pending")}
            className={`flex-1 py-2 px-3.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "pending"
                ? "bg-white text-black shadow-xs"
                : "text-zinc-600 hover:text-black"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Onay Masası ({pendingApps.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("merchants")}
            className={`flex-1 py-2 px-3.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "merchants"
                ? "bg-white text-black shadow-xs"
                : "text-zinc-600 hover:text-black"
            }`}
          >
            <Store className="w-3.5 h-3.5 text-blue-600" />
            <span>Esnaf Listesi ({merchants.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("finance")}
            className={`flex-1 py-2 px-3.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "finance"
                ? "bg-white text-black shadow-xs"
                : "text-zinc-600 hover:text-black"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>Gelir & Paketler</span>
          </button>

          <button
            onClick={() => setActiveTab("broadcast")}
            className={`flex-1 py-2 px-3.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "broadcast"
                ? "bg-white text-black shadow-xs"
                : "text-zinc-600 hover:text-black"
            }`}
          >
            <Send className="w-3.5 h-3.5 text-brand" />
            <span>Toplu Duyuru</span>
          </button>
        </div>

        {/* TAB 1: ONYA MASASI (Triage Queue) */}
        {activeTab === "pending" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-extrabold text-black">
                Onay Bekleyen Esnaf Kayıtları
              </h2>
              <span className="text-xs text-zinc-400 font-medium">
                {pendingApps.length} Başvuru Bekliyor
              </span>
            </div>

            {pendingApps.length > 0 ? (
              <div className="space-y-3">
                {pendingApps.map((app) => (
                  <div
                    key={app.id}
                    className="p-4 rounded-2xl bg-white border border-black/[0.06] shadow-xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/[0.04] pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-sm text-black">{app.name}</h3>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 uppercase">
                            {app.plan} Plan
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 font-medium pt-0.5">
                          {app.masterName} · {app.city} / {app.district} - {app.neighborhood}
                        </p>
                      </div>

                      <div className="text-right sm:text-right">
                        <span className="text-[11px] text-zinc-400 font-medium block">
                          Başvuru Zamanı: {app.submittedAt}
                        </span>
                        <span className="text-xs font-bold text-black">{app.phone}</span>
                      </div>
                    </div>

                    {/* Services Summary */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        Girilen Fiyat Menüsü ({app.services.length} Hizmet):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {app.services.map((s, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-800 font-semibold"
                          >
                            {s.name}: <strong className="text-black">{s.minPrice} ₺ - {s.maxPrice} ₺</strong>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-black/[0.04]">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          `${app.name} ${app.address}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-xs font-bold text-zinc-700 flex items-center gap-1.5 ios-press"
                      >
                        <ExternalLink className="w-3 h-3 text-blue-600" />
                        <span>Google Haritalarda Doğrula ↗</span>
                      </a>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleReject(app.id)}
                          className="px-3.5 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold ios-press"
                        >
                          Reddet
                        </button>
                        <button
                          onClick={() => handleApprove(app.id)}
                          className="px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm ios-press flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Onayla & Canlıya Al</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-white border border-black/[0.06] text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <h3 className="text-sm font-extrabold text-black">Tüm Başvurular İncelendi</h3>
                <p className="text-xs text-zinc-400">Onay bekleyen yeni esnaf kaydı bulunmuyor.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ESNAF LİSTESİ & MODERASYON */}
        {activeTab === "merchants" && (
          <div className="space-y-3">
            {/* Search & Filters */}
            <div className="p-3 rounded-2xl bg-white border border-black/[0.06] shadow-xs space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Esnaf adı, usta veya ilçe ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-100 text-xs font-medium text-black focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="p-1.5 px-3 rounded-xl bg-zinc-100 text-xs font-semibold text-zinc-800"
                >
                  <option value="all">Tüm Şehirler</option>
                  {CITIES.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="p-1.5 px-3 rounded-xl bg-zinc-100 text-xs font-semibold text-zinc-800"
                >
                  <option value="all">Tüm Kategoriler</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Merchants Table / Cards */}
            <div className="space-y-2">
              {filteredMerchants.map((m) => (
                <div
                  key={m.id}
                  className="p-3.5 rounded-2xl bg-white border border-black/[0.06] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/esnaf/${m.slug}`}
                        target="_blank"
                        className="font-extrabold text-sm text-black hover:text-brand flex items-center gap-1"
                      >
                        <span>{m.name}</span>
                        <ExternalLink className="w-3 h-3 text-zinc-400" />
                      </Link>

                      {m.verified && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          Doğrulanmış
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-zinc-500 font-medium">
                      {m.masterName} · {m.city} / {m.district} - {m.neighborhood}
                    </p>
                    <span className="text-[11px] text-zinc-700 font-bold block">
                      Fiyat Aralığı: {m.minPrice} ₺ - {m.maxPrice} ₺ ({m.services.length} Hizmet)
                    </span>
                  </div>

                  {/* Tier Controls */}
                  <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-black/[0.04]">
                    <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl">
                      {(["free", "vitrin", "pro", "vip"] as SubscriptionTier[]).map((tier) => (
                        <button
                          key={tier}
                          onClick={() => handleTierChange(m.id, tier)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-extrabold uppercase transition-all ${
                            m.tier === tier
                              ? tier === "vip"
                                ? "bg-amber-500 text-white shadow-xs"
                                : tier === "pro"
                                ? "bg-blue-600 text-white shadow-xs"
                                : tier === "vitrin"
                                ? "bg-black text-white shadow-xs"
                                : "bg-zinc-300 text-black"
                              : "text-zinc-400 hover:text-black"
                          }`}
                        >
                          {tier}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => handleToggleVerified(m.id, m.verified)}
                      className={`p-2 rounded-xl text-xs font-bold ios-press ${
                        m.verified ? "bg-blue-50 text-blue-700" : "bg-zinc-100 text-zinc-400"
                      }`}
                      title="Doğrulama Rozetini Değiştir"
                    >
                      <ShieldCheck className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: FİNANS & PAKETLER */}
        {activeTab === "finance" && (
          <div className="space-y-4">
            <div className="p-5 rounded-3xl bg-black text-white space-y-3">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Aylık Tekrarlayan Gelir Modeli (MRR)
              </span>
              <div className="text-3xl font-extrabold">
                {totalMRR.toLocaleString("tr-TR")} ₺ <span className="text-sm font-normal text-zinc-400">/ Ay</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-lg">
                Esnafça komisyonsuz sabit vitrin aboneliği modeliyle çalışır. Müşteri işlemlerinden %0 komisyon alınırken, esnaflar vitrin sıralaması için aylık sabit paket öder.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-white border border-black/[0.06] space-y-1">
                <span className="text-xs font-extrabold text-amber-600 flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5" /> VIP Lider Paketi (1.290 ₺/ay)
                </span>
                <div className="text-2xl font-extrabold text-black">{vipCount} Esnaf</div>
                <span className="text-xs text-zinc-400">Toplam: {(vipCount * 1290).toLocaleString("tr-TR")} ₺/ay</span>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-black/[0.06] space-y-1">
                <span className="text-xs font-extrabold text-blue-600 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Pro Mahalleli (590 ₺/ay)
                </span>
                <div className="text-2xl font-extrabold text-black">{proCount} Esnaf</div>
                <span className="text-xs text-zinc-400">Toplam: {(proCount * 590).toLocaleString("tr-TR")} ₺/ay</span>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-black/[0.06] space-y-1">
                <span className="text-xs font-extrabold text-zinc-800 flex items-center gap-1">
                  <Store className="w-3.5 h-3.5" /> Vitrin Paketi (290 ₺/ay)
                </span>
                <div className="text-2xl font-extrabold text-black">{vitrinCount} Esnaf</div>
                <span className="text-xs text-zinc-400">Toplam: {(vitrinCount * 290).toLocaleString("tr-TR")} ₺/ay</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: TOPLU WHATSAPP DUYURUSU */}
        {activeTab === "broadcast" && (
          <div className="p-5 rounded-3xl bg-white border border-black/[0.06] space-y-4">
            <div className="space-y-1">
              <h3 className="font-extrabold text-base text-black flex items-center gap-2">
                <Send className="w-4 h-4 text-brand" />
                <span>Toplu WhatsApp Bildirim & Güncelleme Motoru</span>
              </h3>
              <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                Seçilen ilçe veya kategorideki ustalara tek tıkla toplu fiyat güncelleme veya kampanya duyurusu hazırlayın.
              </p>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <label className="text-xs font-bold text-black block pb-1">Hedef Kitle:</label>
                <select
                  value={broadcastTarget}
                  onChange={(e) => setBroadcastTarget(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-zinc-100 text-xs font-semibold text-black"
                >
                  <option value="all">Tüm Aktif Esnaflar ({merchants.length} Usta)</option>
                  <option value="vip">Sadece VIP Mahalle Liderleri ({vipCount} Usta)</option>
                  <option value="besiktas">Sadece Beşiktaş Bölgesi</option>
                  <option value="kadikoy">Sadece Kadıköy Bölgesi</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-black block pb-1">Duyuru Mesajı:</label>
                <textarea
                  rows={4}
                  value={broadcastText}
                  onChange={(e) => setBroadcastText(e.target.value)}
                  className="w-full p-3 rounded-xl bg-zinc-100 text-xs text-black font-medium focus:outline-none"
                />
              </div>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(broadcastText);
                  setIsCopied(true);
                  setTimeout(() => setIsCopied(false), 3000);
                  showToast("Duyuru metni panoya kopyalandı!");
                }}
                className="w-full py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 ios-press shadow-sm"
              >
                {isCopied ? <Check className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
                <span>{isCopied ? "Panoya Kopyalandı!" : "WhatsApp Toplu İletişim Metnini Kopyala"}</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
