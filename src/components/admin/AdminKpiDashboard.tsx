"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Store, 
  Clock, 
  TrendingUp, 
  Zap, 
  RefreshCw, 
  CheckCircle2, 
  ShieldCheck, 
  Users,
  Send,
  MessageSquare
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
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono scrollbar-none">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-full shrink-0 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-500 dark:text-slate-400 font-semibold text-[11px]">Sistem Durumu:</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">Canlı & Aktif</span>
        </div>

        <Link
          href="/admin/applications"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#0B1120] hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-full shrink-0 transition-colors shadow-xs group cursor-pointer"
        >
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white text-[11px] font-semibold">
            Onay Bekleyenler:
          </span>
          <span className="font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400 text-[11px]">
            {metrics.pendingCount} Başvuru
          </span>
        </Link>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#0B1120] hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-full text-[11px] font-bold uppercase transition-colors shrink-0 shadow-xs cursor-pointer disabled:opacity-50 active:scale-[0.98]"
            title="Telemetri Verilerini Yenile"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin text-blue-500" : ""}`} />
            <span>{isRefreshing ? "Yenileniyor..." : "Yenile"}</span>
          </button>
        )}
      </div>

      {/* 2. 4-Card Primary Bento KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
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
          trend={metrics.pendingCount > 0 ? "İşlem Bekliyor" : "Kuyruk Boş"}
          trendPositive={metrics.pendingCount === 0}
          href="/admin/applications"
          accentColor="amber"
        />

        {/* KPI 3: Monthly Recurring Revenue (MRR) */}
        <KpiStatCard
          title="Aylık Düzenli Gelir (MRR)"
          value={`${metrics.totalMRR.toLocaleString("tr-TR")} ₺`}
          subtitle="Komisyonsuz Sabit Paket Modeli"
          icon={<TrendingUp className="w-5 h-5 text-emerald-500" />}
          trend="%100 Esnaf Geliri"
          trendPositive={true}
          href="/admin/merchants"
          accentColor="emerald"
        />

        {/* KPI 4: Paid Tier Subscribers */}
        <KpiStatCard
          title="Pro & Plus Aboneler"
          value={`${metrics.paidSubscribersCount} Dükkan`}
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
