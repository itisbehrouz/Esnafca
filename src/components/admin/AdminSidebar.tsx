"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Clock, 
  Store, 
  MessageSquare, 
  Send, 
  History, 
  ExternalLink, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  CalendarCheck,
  CreditCard,
  Truck,
  MapPin,
  Users
} from "lucide-react";
import { logoutAdminAction } from "@/app/actions/merchant";

interface AdminSidebarProps {
  pendingCount?: number;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const NAV_ITEMS = [
  {
    label: "Genel Bakış",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Onay Masası",
    href: "/admin/applications",
    icon: Clock,
    badgeKey: "pending",
  },
  {
    label: "Esnaf Listesi",
    href: "/admin/merchants",
    icon: Store,
  },
  {
    label: "Randevu İstatistikleri",
    href: "/admin/appointments",
    icon: CalendarCheck,
  },
  {
    label: "Finans & Tahsilat",
    href: "/admin/finance",
    icon: CreditCard,
  },
  {
    label: "Akrilik QR & Lojistik",
    href: "/admin/logistics",
    icon: Truck,
  },
  {
    label: "Kapsama Haritası",
    href: "/admin/map",
    icon: MapPin,
  },
  {
    label: "Personel & Yetki",
    href: "/admin/staff",
    icon: Users,
  },
  {
    label: "Yorum Masası",
    href: "/admin/reviews",
    icon: MessageSquare,
  },
  {
    label: "Toplu Duyuru",
    href: "/admin/broadcast",
    icon: Send,
  },
  {
    label: "Denetim Kütüğü",
    href: "/admin/audit",
    icon: History,
  },
];

export function AdminSidebar({
  pendingCount = 0,
  collapsed = false,
  onToggleCollapse,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await logoutAdminAction();
    router.push("/admin/login");
    router.refresh();
  };

  const isLinkActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-[#0F172A] border-r border-[#1E293B] flex flex-col z-40 text-slate-200 transition-all duration-200 ease-in-out select-none ${
        collapsed ? "w-[72px]" : "w-[240px]"
      }`}
    >
      {/* Header / Brand */}
      <div className="p-4 border-b border-[#1E293B] flex items-center justify-between h-16 shrink-0">
        {!collapsed && (
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold shadow-sm">
              E
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-white block">
                Esnafça
              </span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-400 block -mt-0.5">
                HQ Workstation
              </span>
            </div>
          </Link>
        )}

        {collapsed && (
          <div className="w-8 h-8 rounded-xl bg-blue-600 mx-auto flex items-center justify-center text-white font-extrabold shadow-sm">
            E
          </div>
        )}

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={collapsed ? "Menüyü Genişlet" : "Menüyü Daralt"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {!collapsed && (
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 px-3 py-1 block">
            Operasyon Masaları
          </span>
        )}

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isLinkActive(item.href);
          const showBadge = item.badgeKey === "pending" && pendingCount > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-[0.98] group ${
                active
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/70"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-4 h-4 shrink-0 ${active ? "text-white" : "text-slate-400 group-hover:text-white"}`} />
              
              {!collapsed && (
                <div className="flex-1 flex items-center justify-between">
                  <span>{item.label}</span>
                  {showBadge && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-amber-500 text-black">
                      {pendingCount}
                    </span>
                  )}
                </div>
              )}

              {collapsed && showBadge && (
                <span className="absolute right-2 top-2 w-2 h-2 rounded-full bg-amber-500" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Footer Actions */}
      <div className="p-3 border-t border-[#1E293B] space-y-1 shrink-0">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/70 transition-colors"
          title={collapsed ? "Siteyi Gör" : undefined}
        >
          <ExternalLink className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Vitrini Aç ↗</span>}
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
          title={collapsed ? "Çıkış Yap" : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Oturumu Kapat</span>}
        </button>

        {!collapsed && (
          <div className="pt-2 text-[10px] font-mono text-slate-400 text-center flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            <span>Zero-Trust Admin Session</span>
          </div>
        )}
      </div>
    </aside>
  );
}
