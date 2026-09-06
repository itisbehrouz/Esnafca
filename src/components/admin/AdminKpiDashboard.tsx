"use client";

import React from "react";
import Link from "next/link";
import { 
  Store, 
  Clock, 
  TrendingUp, 
  Zap, 
  RefreshCw,
} from "lucide-react";
import { KpiStatCard } from "./KpiStatCard";

interface KpiDashboardProps {
  metrics: {
    totalMerchants: number;
    verifiedCount: number;
    pendingCount: number;
    totalMRR: number;
    plusCount: number;
    proCount: number;
    freeCount: number;
    paidSubscribersCount: number;
  };
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function AdminKpiDashboard({
  metrics,
  onRefresh,
  isRefreshing = false,
}: KpiDashboardProps) {
  return (
    <div className="space-y-4 font-sans select-none">
      {/* 1. Live Telemetry Pulse Bar */}
      <div className="flex items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
          <div className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-full shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">Sistem Canlı</span>
          </div>

          {metrics.pendingCount > 0 ? (
            <Link
              href="/admin/applications"
              className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-400 rounded-full transition-colors shadow-xs group cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5" />
              <span className="font-bold tabular-nums text-[11px]">
                {metrics.pendingCount} Onay Bekleyen
              </span>
            </Link>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-slate-400 rounded-full text-[11px]">
              <span>Kuyruk Güncel</span>
            </div>
          )}
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-[#0B1120] hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-full text-[11px] font-bold uppercase transition-colors shrink-0 shadow-xs cursor-pointer disabled:opacity-50 active:scale-[0.98]"
            title="Telemetri Verilerini Yenile"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin text-blue-500" : ""}`} />
            <span>{isRefreshing ? "Yenileniyor..." : "Yenile"}</span>
          </button>
        )}
      </div>

      {/* 2. 4-Card Primary Bento KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 items-stretch">
        {/* KPI 1: Total Live Merchants */}
        <KpiStatCard
          title="Toplam Aktif Esnaf"
          value={metrics.totalMerchants}
          subtitle={`${metrics.verifiedCount} Doğrulanmış Usta`}
          icon={<Store className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
          trend="6 Büyükşehir"
          trendPositive={true}
          href="/admin/merchants"
          accentColor="blue"
        />

        {/* KPI 2: Pending Applications */}
        <KpiStatCard
          title="Onay Bekleyen Kuyruk"
          value={metrics.pendingCount}
          subtitle="İnceleme & Triage Gerekiyor"
          icon={<Clock className="w-5 h-5 text-amber-500" />}
          trend={metrics.pendingCount > 0 ? `${metrics.pendingCount} Bekleyen` : "Kuyruk Boş"}
          trendPositive={metrics.pendingCount === 0}
          href="/admin/applications"
          accentColor="amber"
        />

        {/* KPI 3: Monthly Recurring Revenue (MRR) */}
        <KpiStatCard
          title="Aylık Düzenli Gelir (MRR)"
          value={`${metrics.totalMRR.toLocaleString("tr-TR")} ₺`}
          subtitle="Sabit Paket Modeli"
          icon={<TrendingUp className="w-5 h-5 text-emerald-500" />}
          trend="%0 Komisyon"
          trendPositive={true}
          href="/admin/merchants"
          accentColor="emerald"
        />

        {/* KPI 4: Paid Tier Subscribers */}
        <KpiStatCard
          title="Pro & Plus Aboneler"
          value={metrics.paidSubscribersCount}
          subtitle={`${metrics.plusCount} Plus · ${metrics.proCount} Pro · ${metrics.freeCount} Ücretsiz`}
          icon={<Zap className="w-5 h-5 text-indigo-500" />}
          trend={`${metrics.totalMerchants > 0 ? Math.round((metrics.paidSubscribersCount / metrics.totalMerchants) * 100) : 0}% Dönüşüm`}
          trendPositive={true}
          href="/admin/merchants"
          accentColor="violet"
        />
      </div>
    </div>
  );
}
