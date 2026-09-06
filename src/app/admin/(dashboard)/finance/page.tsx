"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CreditCard,
  TrendingUp,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  DollarSign,
  Gift,
  RotateCcw,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  Search,
  Zap,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import {
  getAdminFinanceMetrics,
  extendSubscriptionAction,
  grantGiftMonthAction,
  refundSubscriptionAction,
  retryFailedPaymentAction,
} from "@/app/actions/admin";

export default function AdminFinancePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"subscriptions" | "transactions" | "recovery">("subscriptions");
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [modalType, setModalType] = useState<"extend" | "gift" | "refund" | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [modalMonths, setModalMonths] = useState<number>(1);
  const [modalReason, setModalReason] = useState<string>("");
  const [modalSubmitting, setModalSubmitting] = useState(false);

  const loadMetrics = async () => {
    try {
      const res = await getAdminFinanceMetrics();
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleExtend = async () => {
    if (!selectedItem) return;
    setModalSubmitting(true);
    try {
      const res = await extendSubscriptionAction(
        selectedItem.merchantId || selectedItem.id,
        modalMonths,
        modalReason || "Operatör uzatımı"
      );
      if (res.success) {
        showToast(`Abonelik başarıyla ${modalMonths} ay uzatıldı.`);
        setModalType(null);
        loadMetrics();
      } else {
        showToast("Hata: " + res.error);
      }
    } catch {
      showToast("İşlem başarısız.");
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleGiftMonth = async () => {
    if (!selectedItem) return;
    if (!modalReason.trim()) {
      showToast("Lütfen hediye ay tanımlama gerekçesini belirtin.");
      return;
    }
    setModalSubmitting(true);
    try {
      const res = await grantGiftMonthAction(
        selectedItem.merchantId || selectedItem.id,
        modalMonths,
        modalReason
      );
      if (res.success) {
        showToast(`Dükkana ${modalMonths} ay ücretsiz hediye tanımlandı.`);
        setModalType(null);
        loadMetrics();
      } else {
        showToast("Hata: " + res.error);
      }
    } catch {
      showToast("İşlem başarısız.");
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleRefund = async () => {
    if (!selectedItem) return;
    if (!modalReason.trim()) {
      showToast("Lütfen iade gerekçesini belirtin.");
      return;
    }
    setModalSubmitting(true);
    try {
      const res = await refundSubscriptionAction(selectedItem.paymentId, modalReason);
      if (res.success) {
        showToast("Ödeme işlemi başarıyla iade edildi ve kaydedildi.");
        setModalType(null);
        loadMetrics();
      } else {
        showToast("Hata: " + res.error);
      }
    } catch {
      showToast("İşlem başarısız.");
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleRetryPayment = async (paymentId: string) => {
    try {
      const res = await retryFailedPaymentAction(paymentId);
      if (res.success) {
        showToast("Tahsilat kurtarma tetiklendi ve başarıyla sonuçlandı.");
        loadMetrics();
      } else {
        showToast("Kurtarma başarısız: " + res.error);
      }
    } catch {
      showToast("İşlem başarısız.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-xs font-mono text-slate-400">
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
        <span>Finans, Tahsilat & MRR Metrikleri Yükleniyor...</span>
      </div>
    );
  }

  const subscriptions = data?.subscriptions || [];
  const payments = data?.payments || [];
  const failedPayments = data?.failedPayments || [];

  const filteredSubscriptions = subscriptions.filter((s: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.merchant?.name?.toLowerCase().includes(q) ||
      s.merchant?.masterName?.toLowerCase().includes(q) ||
      s.merchant?.district?.toLowerCase().includes(q)
    );
  });

  const filteredPayments = payments.filter((p: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.paymentId?.toLowerCase().includes(q) ||
      p.merchant?.name?.toLowerCase().includes(q) ||
      p.provider?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 font-sans select-none pb-12">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-full text-xs font-bold shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Subtitle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Finans, Abonelik & Tahsilat Masası
            </h1>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              Canlı Nakit Akışı
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Yinelenen abonelikler, aylık tekrarlayan gelir (MRR), webhook sağlık durumu ve kurtarma operasyonları.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setRefreshing(true);
            loadMetrics();
          }}
          disabled={refreshing}
          className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-2 transition-colors active:scale-[0.98] w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-blue-500 ${refreshing ? "animate-spin" : ""}`} />
          <span>Yenile</span>
        </button>
      </div>

      {/* Bento KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MRR Card */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Aylık Tekrarlayan Gelir (MRR)
            </span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono tabular-nums text-slate-900 dark:text-white">
              {Number(data?.totalMRR || 0).toLocaleString("tr-TR")} ₺
            </span>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              / ay
            </span>
          </div>
          <p className="mt-1.5 text-[11px] font-mono text-slate-400">
            {data?.proCount || 0} Pro (390₺ / 750₺) + {data?.plusCount || 0} Plus (890₺)
          </p>
        </div>

        {/* Projected ARR */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Öngörülen Yıllık Gelir (ARR)
            </span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono tabular-nums text-slate-900 dark:text-white">
              {Number(data?.totalARR || 0).toLocaleString("tr-TR")} ₺
            </span>
            <span className="text-[11px] font-semibold text-slate-400">/ yıl</span>
          </div>
          <p className="mt-1.5 text-[11px] font-mono text-slate-400">
            12 Aylık Projeksiyon Matrisi
          </p>
        </div>

        {/* Active Subscribers */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Aktif Ücretli Abone
            </span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono tabular-nums text-slate-900 dark:text-white">
              {data?.activePaidCount || 0}
            </span>
            <span className="text-[11px] font-bold text-slate-400">Esnaf</span>
          </div>
          <p className="mt-1.5 text-[11px] font-mono text-slate-400">
            Önümüzdeki 7 günde: <strong className="text-amber-500">{data?.renewingIn7Days || 0}</strong> yenileme
          </p>
        </div>

        {/* Payment Health */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tahsilat Başarı Oranı
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              %{data?.successRate || 100}
            </span>
            <span className="text-[11px] font-semibold text-slate-400">webhook başarısı</span>
          </div>
          <p className="mt-1.5 text-[11px] font-mono text-slate-400">
            {failedPayments.length > 0 ? (
              <span className="text-rose-500 font-bold">{failedPayments.length} Hata kurtarma bekliyor</span>
            ) : (
              <span className="text-emerald-500">Tüm ödeme akışları sağlıklı</span>
            )}
          </p>
        </div>
      </div>

      {/* Tabs & Search Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab("subscriptions")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "subscriptions"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Aktif Abonelikler ({subscriptions.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("transactions")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "transactions"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Tahsilat & Webhook Kütüğü ({payments.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("recovery")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all relative ${
              activeTab === "recovery"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Kurtarma & Müdahale ({failedPayments.length})
            {failedPayments.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[9px] bg-rose-500 text-white font-mono">
                !
              </span>
            )}
          </button>
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Esnaf, ödeme ID veya ilçe ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tab 1: Subscriptions Table */}
      {activeTab === "subscriptions" && (
        <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-3 px-4 font-bold">Esnaf & Bölge</th>
                  <th className="py-3 px-4 font-bold">Paket & Tutar</th>
                  <th className="py-3 px-4 font-bold">Döngü</th>
                  <th className="py-3 px-4 font-bold">Gelecek Yenileme</th>
                  <th className="py-3 px-4 font-bold text-center">Durum</th>
                  <th className="py-3 px-4 font-bold text-right">Operatör Müdahalesi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredSubscriptions.length > 0 ? (
                  filteredSubscriptions.map((sub: any) => (
                    <tr
                      key={sub.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {sub.merchant?.name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {sub.merchant?.masterName} · {sub.merchant?.district} / {sub.merchant?.city}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono tabular-nums">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase mr-1.5 ${
                            sub.tier === "plus"
                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                              : "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                          }`}
                        >
                          {sub.tier}
                        </span>
                        <strong className="text-slate-900 dark:text-white font-bold">
                          {sub.price} ₺
                        </strong>
                      </td>

                      <td className="py-3 px-4 text-[11px] text-slate-500 font-medium">
                        {sub.billingInterval === "annual" ? "Yıllık (Peşin)" : "Aylık Yinelenen"}
                      </td>

                      <td className="py-3 px-4 font-mono tabular-nums text-xs">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {new Date(sub.nextRenewalDate).toLocaleDateString("tr-TR")}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {Math.max(
                            0,
                            Math.ceil(
                              (new Date(sub.nextRenewalDate).getTime() - new Date().getTime()) /
                                (1000 * 60 * 60 * 24)
                            )
                          )}{" "}
                          gün kaldı
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          {sub.status === "active" ? "Aktif" : sub.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedItem(sub);
                              setModalMonths(1);
                              setModalReason("Operatör manuel abonelik uzatımı");
                              setModalType("extend");
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 text-xs font-bold transition-all"
                            title="Abonelik süresini uzat"
                          >
                            <Calendar className="w-3.5 h-3.5 inline mr-1" />
                            <span>Süre Uzat</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedItem(sub);
                              setModalMonths(1);
                              setModalReason("Sadakat veya destek telafisi hediye ayı");
                              setModalType("gift");
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 text-purple-600 dark:text-purple-400 text-xs font-bold transition-all"
                            title="Hediye ay tanımla"
                          >
                            <Gift className="w-3.5 h-3.5 inline mr-1" />
                            <span>Hediye Ay</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Abonelik kaydı bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Payment Webhook Logs */}
      {activeTab === "transactions" && (
        <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-3 px-4 font-bold">Ödeme ID</th>
                  <th className="py-3 px-4 font-bold">Esnaf</th>
                  <th className="py-3 px-4 font-bold">Tutar</th>
                  <th className="py-3 px-4 font-bold">Sağlayıcı</th>
                  <th className="py-3 px-4 font-bold">Durum</th>
                  <th className="py-3 px-4 font-bold">Tarih</th>
                  <th className="py-3 px-4 font-bold text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredPayments.length > 0 ? (
                  filteredPayments.map((p: any) => (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-slate-900 dark:text-white font-bold">
                        {p.paymentId}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">
                          {p.merchant?.name || "Bilinmiyor"}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono tabular-nums font-extrabold text-slate-900 dark:text-white">
                        {p.amount} {p.currency}
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded font-mono text-[10px] uppercase font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {p.provider}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            p.status === "SUCCESS"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : p.status === "REFUNDED"
                              ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {p.status === "SUCCESS" ? "Başarılı" : p.status === "REFUNDED" ? "İade Edildi" : "Başarısız"}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono tabular-nums text-slate-400 text-[11px]">
                        {new Date(p.createdAt).toLocaleString("tr-TR")}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {p.status === "SUCCESS" && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedItem(p);
                              setModalReason("Müşteri/Esnaf talebi doğrultusunda paket iptali ve iade");
                              setModalType("refund");
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all"
                          >
                            <RotateCcw className="w-3.5 h-3.5 inline mr-1" />
                            <span>İade Et</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Ödeme kaydı bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Recovery Table */}
      {activeTab === "recovery" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-extrabold text-sm text-amber-900 dark:text-amber-200">
                Tahsilat Hata ve Kurtarma Protokolü
              </h3>
              <p className="text-xs text-amber-800 dark:text-amber-300/90 mt-0.5">
                Bankadan dönen başarısız webhook çağrıları esnafın dükkanını doğrudan kapatmaz; 3 günlük yetkisiz kurtarma süreci başlar. Operatör buradan işlemi manuel yeniden tetikleyebilir veya esnafla irtibata geçebilir.
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            {failedPayments.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {failedPayments.map((p: any) => (
                  <div key={p.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-rose-500">
                          {p.paymentId}
                        </span>
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                          {p.merchant?.name}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                          {p.amount} ₺
                        </span>
                      </div>
                      <p className="text-xs text-rose-600 dark:text-rose-400 font-medium mt-1">
                        Hata Nedeni: {p.failureReason || "Bilinmeyen kart hatası"}
                      </p>
                      <span className="text-[10px] font-mono text-slate-400">
                        Kayıt Zamanı: {new Date(p.createdAt).toLocaleString("tr-TR")}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleRetryPayment(p.paymentId)}
                        className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-[0.98]"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Kurtarma Tetikle (Retry)</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Bekleyen Tahsilat Hatası Yok
                </p>
                <p className="text-[11px]">
                  Tüm yenileme ödemeleri başarıyla işlenmiş durumda.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Modals */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                {modalType === "extend"
                  ? "Abonelik Süresi Uzat"
                  : modalType === "gift"
                  ? "Hediye Ay Tanımla"
                  : "Ödeme İadesi (Refund)"}
              </h3>
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[11px] font-bold text-slate-500 block mb-1">
                  Hedef Dükkan / İşlem:
                </span>
                <p className="font-bold text-slate-900 dark:text-white">
                  {selectedItem?.merchant?.name || selectedItem?.merchantName || selectedItem?.paymentId}
                </p>
              </div>

              {(modalType === "extend" || modalType === "gift") && (
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">
                    Eklenecek Ay Miktarı:
                  </label>
                  <select
                    value={modalMonths}
                    onChange={(e) => setModalMonths(Number(e.target.value))}
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                  >
                    <option value={1}>+1 Ay (Standart)</option>
                    <option value={2}>+2 Ay</option>
                    <option value={3}>+3 Ay (Çeyrek)</option>
                    <option value={6}>+6 Ay</option>
                    <option value={12}>+12 Ay (1 Yıl)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  Operatör Gerekçesi (Audit Kütüğüne Yazılır):
                </label>
                <textarea
                  rows={3}
                  value={modalReason}
                  onChange={(e) => setModalReason(e.target.value)}
                  placeholder="Gerekçe giriniz..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700"
              >
                Vazgeç
              </button>

              <button
                type="button"
                disabled={modalSubmitting}
                onClick={() => {
                  if (modalType === "extend") handleExtend();
                  else if (modalType === "gift") handleGiftMonth();
                  else if (modalType === "refund") handleRefund();
                }}
                className={`px-4 py-2 rounded-xl text-white text-xs font-bold shadow-xs transition-all active:scale-[0.98] ${
                  modalType === "refund"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {modalSubmitting ? "İşleniyor..." : "Onayla ve Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
