"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Clock, 
  Store, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  MessageSquare, 
  Send, 
  History, 
  ExternalLink,
  Zap,
  TrendingUp,
  CreditCard,
  Truck,
  MapPin,
  Users
} from "lucide-react";
import { getAdminDashboardMetrics, approveApplicationAction, rejectApplicationAction } from "@/app/actions/admin";
import { AdminKpiDashboard } from "@/components/admin/AdminKpiDashboard";
import { MerchantApplicationDrawer } from "@/components/admin/MerchantApplicationDrawer";

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const res = await getAdminDashboardMetrics();
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleQuickApprove = async (appId: string) => {
    const res = await approveApplicationAction(appId);
    if (res.success) {
      showToast("Başvuru onaylandı ve vitrine alındı.");
      loadData();
    } else {
      showToast("Hata: " + res.error);
    }
  };

  const handleQuickReject = async (appId: string) => {
    const res = await rejectApplicationAction(appId, "Hızlı karar masasında reddedildi.");
    if (res.success) {
      showToast("Başvuru reddedildi.");
      loadData();
    } else {
      showToast("Hata: " + res.error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-xs font-mono text-slate-400">
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
        <span>HQ Telemetri ve Bento Verileri Yükleniyor...</span>
      </div>
    );
  }

  const metrics = {
    totalMerchants: data?.totalMerchants || 0,
    verifiedCount: data?.verifiedCount || 0,
    pendingCount: data?.pendingCount || 0,
    totalMRR: data?.totalMRR || 0,
    plusCount: data?.plusCount || 0,
    proCount: data?.proCount || 0,
    freeCount: data?.freeCount || 0,
    paidSubscribersCount: data?.paidSubscribersCount || 0,
  };

  const pendingApps = data?.pendingApplications || [];
  const recentLogs = data?.recentLogs || [];
  const recentReviews = data?.recentReviews || [];

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-full text-xs font-bold shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Bento Grid Dashboard Metrics */}
      <AdminKpiDashboard
        metrics={metrics}
        onRefresh={() => {
          setIsRefreshing(true);
          loadData();
        }}
        isRefreshing={isRefreshing}
      />

      {/* 2. Dual Radar Section: Pending Applications Radar & Recent Audit Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Pending Applications Radar (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Kritik Başvuru Radarı
                  </h2>
                  <span className="text-[11px] font-mono text-slate-400">
                    {pendingApps.length} Başvuru Onay Bekliyor
                  </span>
                </div>
              </div>

              <Link
                href="/admin/applications"
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>Tümünü Gör</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Application Cards */}
            {pendingApps.length > 0 ? (
              <div className="space-y-3">
                {pendingApps.slice(0, 4).map((app: any) => (
                  <div
                    key={app.id}
                    className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 space-y-2.5 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {app.name}
                          </h3>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 uppercase">
                            {app.plan}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {app.masterName} · {app.city} / {app.district} ({app.category})
                        </p>
                      </div>

                      <span className="text-[10px] font-mono tabular-nums text-slate-400">
                        {new Date(app.createdAt).toLocaleDateString("tr-TR")}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="font-mono tabular-nums text-slate-500">{app.phone}</span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedApp(app);
                            setIsDrawerOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors"
                        >
                          İncele
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickApprove(app.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs"
                        >
                          Onayla
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-slate-400 space-y-1">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Tüm Başvurular Güncel</p>
                <p className="text-[11px]">Kuyrukta bekleyen yeni esnaf kaydı bulunmuyor.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Recent Operator Activity & Quick Launchpads (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Recent Audit Log */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-blue-500" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                  Son Operatör Hareketleri
                </h3>
              </div>
              <Link href="/admin/audit" className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline">
                Kütüğe Git ↗
              </Link>
            </div>

            {recentLogs.length > 0 ? (
              <div className="space-y-2">
                {recentLogs.slice(0, 5).map((log: any) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px]">
                        {log.operator}: {log.action}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 block">
                        Hedef: #{log.targetId.slice(-6)}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono tabular-nums text-slate-400 shrink-0">
                      {new Date(log.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">Henüz kayıtlı işlem yok.</p>
            )}
          </div>

          {/* Quick Launchpad Buttons */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block pb-1">
              Hızlı Operasyon Kısayolları
            </span>

            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/admin/finance"
                className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 transition-all active:scale-[0.98]"
              >
                <CreditCard className="w-4 h-4 text-blue-500" />
                <span>Finans & MRR</span>
              </Link>

              <Link
                href="/admin/logistics"
                className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 transition-all active:scale-[0.98]"
              >
                <Truck className="w-4 h-4 text-amber-500" />
                <span>Pleksi & Lojistik</span>
              </Link>

              <Link
                href="/admin/map"
                className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 transition-all active:scale-[0.98]"
              >
                <MapPin className="w-4 h-4 text-rose-500" />
                <span>Kapsama Haritası</span>
              </Link>

              <Link
                href="/admin/staff"
                className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 transition-all active:scale-[0.98]"
              >
                <Users className="w-4 h-4 text-indigo-500" />
                <span>Personel Yetki</span>
              </Link>

              <Link
                href="/admin/broadcast"
                className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 transition-all active:scale-[0.98]"
              >
                <Send className="w-4 h-4 text-emerald-500" />
                <span>Toplu WhatsApp</span>
              </Link>

              <Link
                href="/admin/reviews"
                className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 transition-all active:scale-[0.98]"
              >
                <MessageSquare className="w-4 h-4 text-purple-500" />
                <span>Yorum Masası</span>
              </Link>

              <Link
                href="/admin/merchants"
                className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 transition-all active:scale-[0.98]"
              >
                <Store className="w-4 h-4 text-blue-500" />
                <span>Esnaf Tablosu</span>
              </Link>

              <Link
                href="/"
                target="_blank"
                className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 transition-all active:scale-[0.98]"
              >
                <ExternalLink className="w-4 h-4 text-amber-500" />
                <span>Canlı Vitrin ↗</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Deep Inspection Drawer Modal */}
      <MerchantApplicationDrawer
        application={selectedApp}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onApproved={() => loadData()}
        onRejected={() => loadData()}
      />
    </div>
  );
}
