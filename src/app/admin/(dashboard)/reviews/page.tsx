"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  MessageSquare, 
  Trash2, 
  Search, 
  Star, 
  CheckCircle2, 
  RefreshCw, 
  Store, 
  ExternalLink,
  ShieldAlert
} from "lucide-react";
import { getAdminReviews, deleteReviewAction } from "@/app/actions/admin";

export default function ReviewsModerationPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRating, setSelectedRating] = useState("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadReviews = async () => {
    try {
      const res = await getAdminReviews();
      if (res.success && res.data) {
        setReviews(res.data);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDeleteReview = async (reviewId: string, author: string) => {
    if (!window.confirm(`"${author}" tarafından yapılan bu yorumu silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      const res = await deleteReviewAction(reviewId, "Topluluk kurallarına aykırı / spam değerlendirme");
      if (res.success) {
        setReviews((prev) => prev.filter((r) => r.id !== reviewId));
        showToast("Yorum başarıyla silindi ve esnaf puanı güncellendi.");
      } else {
        showToast("Hata: " + res.error);
      }
    } catch {
      showToast("İşlem gerçekleştirilemedi.");
    }
  };

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      if (selectedRating !== "all" && String(r.rating) !== selectedRating) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          r.author.toLowerCase().includes(q) ||
          r.comment.toLowerCase().includes(q) ||
          r.merchant?.name?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [reviews, searchQuery, selectedRating]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-xs font-mono text-slate-400">
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
        <span>Yorum Moderasyon Masası Yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans select-none">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-full text-xs font-bold shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
              Müşteri Yorum Moderasyon Masası
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Kullanıcıların esnaflara yaptığı değerlendirmeleri denetleyin, asılsız veya hakaret içeren yorumları kaldırın.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsRefreshing(true);
            loadReviews();
          }}
          disabled={isRefreshing}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors self-start sm:self-center"
          title="Listeyi Yenile"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-blue-500" : ""}`} />
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Yazar, esnaf veya yorum içeriğinde ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedRating}
            onChange={(e) => setSelectedRating(e.target.value)}
            className="p-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">Tüm Puanlar</option>
            <option value="5">5 Yıldız</option>
            <option value="4">4 Yıldız</option>
            <option value="3">3 Yıldız</option>
            <option value="2">2 Yıldız</option>
            <option value="1">1 Yıldız (Kritik)</option>
          </select>

          <span className="text-xs text-slate-500 font-mono tabular-nums">
            {filteredReviews.length} Yorum
          </span>
        </div>
      </div>

      {/* Reviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredReviews.length > 0 ? (
          filteredReviews.map((r) => (
            <div
              key={r.id}
              className="p-4 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800/80 shadow-xs flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < r.rating ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-700"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-mono tabular-nums font-bold text-xs text-slate-900 dark:text-white">
                      {r.rating}.0
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-slate-400">
                    {r.date}
                  </span>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                  &ldquo;{r.comment}&rdquo;
                </p>
              </div>

              {/* Footer / Merchant & Delete */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">{r.author}</span>
                  {r.merchant && (
                    <Link
                      href={`/esnaf/${r.merchant.slug}`}
                      target="_blank"
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <Store className="w-3 h-3" />
                      <span>{r.merchant.name}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </Link>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteReview(r.id, r.author)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 transition-colors flex items-center gap-1 active:scale-[0.98]"
                  title="Yorumu Kaldır"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Kaldır</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 p-12 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-center text-slate-400">
            Kriterlere uygun müşteri yorumu bulunamadı.
          </div>
        )}
      </div>
    </div>
  );
}
