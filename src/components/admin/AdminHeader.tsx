"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { 
  Search, 
  Bell, 
  Activity, 
  ShieldCheck, 
  Command as CommandIcon 
} from "lucide-react";
import { AdminThemeToggle } from "./AdminThemeToggle";

interface AdminHeaderProps {
  onOpenCommandPalette: () => void;
  onOpenNotifications: () => void;
  unreadCount?: number;
  sidebarCollapsed?: boolean;
}

const ROUTE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/admin": {
    title: "Genel Bakış & Operasyon Paneli",
    subtitle: "Bento KPI metrikleri, canlı başvuru radarı ve telemetri",
  },
  "/admin/applications": {
    title: "Başvuru Onay Masası",
    subtitle: "Yeni zanaatkar başvuruları derin inceleme ve tek tıkla onay iş istasyonu",
  },
  "/admin/merchants": {
    title: "Esnaflar Master Tablosu",
    subtitle: "Tüm aktif dükkanlar, paket yönetimi, arama ve filtreleme",
  },
  "/admin/appointments": {
    title: "Randevu & Talep Takip Masası",
    subtitle: "Kullanıcı randevuları, saat teyitleri ve müşteri iletişim kanalları",
  },
  "/admin/reviews": {
    title: "Müşteri Yorum Moderasyon Masası",
    subtitle: "Kullanıcı değerlendirmeleri ve spam/küfür denetimi",
  },
  "/admin/broadcast": {
    title: "Toplu WhatsApp & SMS Duyuru Masası",
    subtitle: "Bölgesel ve kategori bazlı usta bilgilendirme motoru",
  },
  "/admin/audit": {
    title: "Operatör Denetim Kütüğü",
    subtitle: "Zero-Trust güvenlik ve yönetici işlem hareket geçmişi",
  },
};

export function AdminHeader({
  onOpenCommandPalette,
  onOpenNotifications,
  unreadCount = 0,
  sidebarCollapsed = false,
}: AdminHeaderProps) {
  const pathname = usePathname();
  const currentRouteInfo = ROUTE_TITLES[pathname] || {
    title: "HQ Kontrol Masası",
    subtitle: "Esnafça Digital Business Platform",
  };

  return (
    <header
      className={`sticky top-0 z-30 h-16 bg-white/90 dark:bg-[#020617]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 transition-all duration-200 select-none ${
        sidebarCollapsed ? "ml-[72px]" : "ml-[240px]"
      }`}
    >
      {/* Route Title & Breadcrumb */}
      <div>
        <h1 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
          {currentRouteInfo.title}
        </h1>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
          {currentRouteInfo.subtitle}
        </p>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Cmd+K Search Trigger Button */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all active:scale-[0.98] shadow-xs"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Hızlı Arama...</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">
            <CommandIcon className="w-2.5 h-2.5" /> K
          </kbd>
        </button>

        {/* Live DevTower Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-mono font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>DevTower 3005</span>
        </div>

        {/* Notification Bell */}
        <button
          type="button"
          onClick={onOpenNotifications}
          className="relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors active:scale-[0.98]"
          title="Bildirim Kütüğünü Aç"
          aria-label="Bildirimler"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-amber-500 text-black text-[10px] font-mono font-extrabold flex items-center justify-center shadow-xs animate-in zoom-in">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Theme Toggle */}
        <AdminThemeToggle />

        {/* Operator Badge */}
        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
            OP
          </div>
          <div className="text-left hidden md:block">
            <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
              HQ Operatör
            </span>
            <span className="text-[10px] font-mono text-emerald-500 font-semibold block leading-tight">
              Aktif Oturum
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
