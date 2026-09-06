"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Search, 
  ExternalLink, 
  ShieldCheck, 
  ShieldAlert, 
  Crown, 
  Zap, 
  Store, 
  Download, 
  ArrowUpDown, 
  Filter, 
  Trash2, 
  CheckCircle2, 
  Phone,
  MessageCircle,
  MapPin,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import type { Merchant, SubscriptionTier } from "@/types";
import { CITIES } from "@/data/cities";
import { CATEGORIES } from "@/data/categories";
import { updateMerchantTierAction, toggleMerchantVerifiedAction, deleteMerchantAction } from "@/app/actions/admin";

interface MerchantsMasterTableProps {
  merchants: Merchant[];
  onDataChanged?: () => void;
}

export function MerchantsMasterTable({
  merchants: initialMerchants,
  onDataChanged,
}: MerchantsMasterTableProps) {
  const [merchants, setMerchants] = useState<Merchant[]>(initialMerchants);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTier, setSelectedTier] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortField, setSortField] = useState<"name" | "rating" | "price" | "date">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [isMutating, setIsMutating] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync state if initialMerchants change
  React.useEffect(() => {
    setMerchants(initialMerchants);
  }, [initialMerchants]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Inline Tier Update
  const handleTierChange = async (merchantId: string, newTier: SubscriptionTier) => {
    setIsMutating(merchantId);
    try {
      const res = await updateMerchantTierAction(merchantId, newTier);
      if (res.success) {
        setMerchants((prev) =>
          prev.map((m) => (m.id === merchantId ? { ...m, tier: newTier } : m))
        );
        showToast(`Paket ${newTier.toUpperCase()} olarak güncellendi.`);
        onDataChanged?.();
      } else {
        showToast("Hata: " + res.error);
      }
    } catch {
      showToast("Paket güncellenemedi.");
    } finally {
      setIsMutating(null);
    }
  };

  // Inline Verification Toggle
  const handleToggleVerified = async (merchantId: string) => {
    setIsMutating(merchantId);
    try {
      const res = await toggleMerchantVerifiedAction(merchantId);
      if (res.success) {
        setMerchants((prev) =>
          prev.map((m) => (m.id === merchantId ? { ...m, verified: res.verified! } : m))
        );
        showToast(res.verified ? "Doğrulama rozeti verildi." : "Doğrulama rozeti kaldırıldı.");
        onDataChanged?.();
      } else {
        showToast("Hata: " + res.error);
      }
    } catch {
      showToast("İşlem başarısız.");
    } finally {
      setIsMutating(null);
    }
  };

  // Delete Merchant
  const handleDeleteMerchant = async (merchantId: string, merchantName: string) => {
    if (!window.confirm(`"${merchantName}" dükkanını kalıcı olarak silmek istediğinizden emin misiniz?`)) {
      return;
    }

    setIsMutating(merchantId);
    try {
      const res = await deleteMerchantAction(merchantId);
      if (res.success) {
        setMerchants((prev) => prev.filter((m) => m.id !== merchantId));
        showToast("Esnaf kaydı sistemden silindi.");
        onDataChanged?.();
      } else {
        showToast("Hata: " + res.error);
      }
    } catch {
      showToast("Silme işlemi başarısız.");
    } finally {
      setIsMutating(null);
    }
  };

  // CSV Export
  const handleExportCsv = () => {
    const headers = ["ID", "Dükkan Adı", "Usta Adı", "Kategori", "İl", "İlçe", "Telefon", "WhatsApp", "Paket", "Doğrulanmış", "Puan", "Yorum Sayısı", "Min Fiyat", "Max Fiyat"];
    const rows = filteredMerchants.map((m) => [
      m.id,
      `"${m.name.replace(/"/g, '""')}"`,
      `"${m.masterName.replace(/"/g, '""')}"`,
      m.category,
      m.city,
      m.district,
      m.phone,
      m.whatsapp,
      m.tier,
      m.verified ? "Evet" : "Hayır",
      m.rating,
      m.reviewCount,
      m.minPrice,
      m.maxPrice,
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `esnafca_esnaflar_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV dosyası başarıyla indirildi.");
  };

  // Filtering & Sorting logic
  const filteredMerchants = useMemo(() => {
    return merchants
      .filter((m) => {
        if (selectedCity !== "all" && m.city !== selectedCity) return false;
        if (selectedCategory !== "all" && m.category !== selectedCategory) return false;
        if (selectedTier !== "all" && m.tier !== selectedTier) return false;
        if (selectedStatus === "verified" && !m.verified) return false;
        if (selectedStatus === "unverified" && m.verified) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            m.name.toLowerCase().includes(q) ||
            m.masterName.toLowerCase().includes(q) ||
            m.district.toLowerCase().includes(q) ||
            m.phone.includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        let comp = 0;
        if (sortField === "name") comp = a.name.localeCompare(b.name, "tr");
        else if (sortField === "rating") comp = a.rating - b.rating;
        else if (sortField === "price") comp = a.minPrice - b.minPrice;
        else if (sortField === "date") comp = (a as any).createdAt ? new Date((a as any).createdAt).getTime() - new Date((b as any).createdAt).getTime() : 0;
        return sortOrder === "asc" ? comp : -comp;
      });
  }, [merchants, searchQuery, selectedCity, selectedCategory, selectedTier, selectedStatus, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredMerchants.length / pageSize) || 1;
  const paginatedMerchants = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMerchants.slice(start, start + pageSize);
  }, [filteredMerchants, currentPage, pageSize]);

  return (
    <div className="space-y-4 font-sans select-none">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-full text-xs font-bold shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Control Bar: Search, Filters & Export */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Esnaf adı, usta, ilçe veya telefon numarası ara..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors active:scale-[0.98]"
              title="CSV olarak dışa aktar"
            >
              <Download className="w-3.5 h-3.5 text-blue-500" />
              <span>CSV Dışa Aktar</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/60 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Filter className="w-3 h-3" />
            <span>Filtreler:</span>
          </span>

          <select
            value={selectedCity}
            onChange={(e) => {
              setSelectedCity(e.target.value);
              setCurrentPage(1);
            }}
            className="p-1.5 px-3 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-none"
          >
            <option value="all">Tüm Şehirler ({CITIES.length})</option>
            {CITIES.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="p-1.5 px-3 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-none"
          >
            <option value="all">Tüm Kategoriler ({CATEGORIES.length})</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedTier}
            onChange={(e) => {
              setSelectedTier(e.target.value);
              setCurrentPage(1);
            }}
            className="p-1.5 px-3 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-none"
          >
            <option value="all">Tüm Paketler</option>
            <option value="plus">Sadece Plus (890 ₺)</option>
            <option value="pro">Sadece Pro (390 ₺)</option>
            <option value="free">Ücretsiz Mahalleli</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="p-1.5 px-3 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-none"
          >
            <option value="all">Tüm Rozetler</option>
            <option value="verified">Sadece Doğrulanmış</option>
            <option value="unverified">Doğrulanmamış</option>
          </select>

          <div className="ml-auto text-xs text-slate-500 font-mono tabular-nums">
            Toplam: <strong className="text-slate-900 dark:text-white font-bold">{filteredMerchants.length}</strong> Esnaf
          </div>
        </div>
      </div>

      {/* High-Density Data Table */}
      <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3 px-4 font-bold">Esnaf & Usta</th>
                <th className="py-3 px-4 font-bold">Bölge (İl / İlçe)</th>
                <th className="py-3 px-4 font-bold">İletişim</th>
                <th className="py-3 px-4 font-bold">Hizmet & Fiyat Menüsü</th>
                <th className="py-3 px-4 font-bold">Abonelik Paketi</th>
                <th className="py-3 px-4 font-bold text-center">Doğrulama</th>
                <th className="py-3 px-4 font-bold text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {paginatedMerchants.length > 0 ? (
                paginatedMerchants.map((m) => {
                  const isBusy = isMutating === m.id;
                  return (
                    <tr
                      key={m.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Esnaf & Usta */}
                      <td className="py-3 px-4">
                        <div className="flex items-start gap-2.5">
                          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                            <Store className="w-4 h-4" />
                          </div>
                          <div>
                            <Link
                              href={`/esnaf/${m.slug}`}
                              target="_blank"
                              className="font-extrabold text-sm text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1"
                            >
                              <span>{m.name}</span>
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </Link>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
                              {m.masterName} · {m.experienceYears} yıl tecrübe
                            </span>
                            <span className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400">
                              {m.category}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Bölge */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {m.city} / {m.district}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate max-w-[160px]">
                            {m.neighborhood}
                          </span>
                        </div>
                      </td>

                      {/* İletişim */}
                      <td className="py-3 px-4 font-mono tabular-nums">
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                            {m.phone}
                          </span>
                          {m.whatsapp && (
                            <a
                              href={`https://wa.me/90${m.whatsapp.replace(/\D/g, "").replace(/^0/, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>WhatsApp</span>
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Hizmet & Fiyat Menüsü */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <span className="font-mono tabular-nums font-extrabold text-blue-600 dark:text-blue-400 text-xs block">
                            {m.minPrice} ₺ - {m.maxPrice} ₺
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {m.services?.length || 0} Hizmet Tanımlı
                          </span>
                        </div>
                      </td>

                      {/* Abonelik Paketi (Inline Switcher) */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-fit">
                          {(["free", "pro", "plus"] as SubscriptionTier[]).map((tier) => (
                            <button
                              key={tier}
                              disabled={isBusy}
                              onClick={() => handleTierChange(m.id, tier)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-all active:scale-[0.98] ${
                                m.tier === tier
                                  ? tier === "plus"
                                    ? "bg-amber-500 text-white shadow-xs"
                                    : tier === "pro"
                                    ? "bg-indigo-600 text-white shadow-xs"
                                    : "bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-white"
                                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                              }`}
                            >
                              {tier}
                            </button>
                          ))}
                        </div>
                      </td>

                      {/* Doğrulama Rozeti */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleToggleVerified(m.id)}
                          className={`p-2 rounded-xl transition-all active:scale-[0.98] ${
                            m.verified
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                          }`}
                          title={m.verified ? "Doğrulanmış Rozeti Kaldır" : "Doğrulanmış Rozeti Ver"}
                        >
                          <ShieldCheck className="w-4 h-4" />
                        </button>
                      </td>

                      {/* İşlemler */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/esnaf/${m.slug}`}
                            target="_blank"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Vitrin Sayfasını Aç"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleDeleteMerchant(m.id, m.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Esnafı Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Arama kriterlerine uygun esnaf kaydı bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 font-mono tabular-nums">
            Sayfa <strong className="text-slate-900 dark:text-white font-bold">{currentPage}</strong> / {totalPages} ({filteredMerchants.length} Kayıt)
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-all font-bold flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Önceki</span>
            </button>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-all font-bold flex items-center gap-1"
            >
              <span>Sonraki</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
