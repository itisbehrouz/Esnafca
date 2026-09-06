"use client";

import React, { useState } from "react";
import { 
  Search, 
  Clock, 
  Store, 
  CheckCircle2, 
  MapPin, 
  Phone, 
  MessageCircle, 
  ExternalLink, 
  Crown, 
  Filter,
  Eye
} from "lucide-react";
import type { MerchantApplication } from "@prisma/client";
import { MerchantApplicationDrawer } from "./MerchantApplicationDrawer";

interface WorkstationLayoutProps {
  applications: Array<MerchantApplication & { servicesParsed?: any[] }>;
  onDataChanged?: () => void;
}

export function WorkstationLayout({
  applications,
  onDataChanged,
}: WorkstationLayoutProps) {
  const [selectedApp, setSelectedApp] = useState<(MerchantApplication & { servicesParsed?: any[] }) | null>(
    applications[0] || null
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const filtered = applications.filter((app) => {
    if (selectedStatus !== "all" && app.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        app.name.toLowerCase().includes(q) ||
        app.masterName.toLowerCase().includes(q) ||
        app.district.toLowerCase().includes(q) ||
        app.city.toLowerCase().includes(q) ||
        app.phone.includes(q)
      );
    }
    return true;
  });

  return (
    <div className="font-sans select-none space-y-4">
      {/* Workstation Master-Detail Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (Master Queue) - 5 Cols */}
        <div className="lg:col-span-5 space-y-3">
          {/* Search & Filter Header */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-2.5">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Başvuru ara (ad, usta, ilçe)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                {["all", "pending", "approved", "rejected"].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setSelectedStatus(st)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                      selectedStatus === st
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {st === "all"
                      ? "Tümü"
                      : st === "pending"
                      ? "Bekleyen"
                      : st === "approved"
                      ? "Onaylı"
                      : "Red"}
                  </button>
                ))}
              </div>

              <span className="text-[11px] font-mono tabular-nums text-slate-400">
                {filtered.length} Kayıt
              </span>
            </div>
          </div>

          {/* Queue List Items */}
          <div className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
            {filtered.length > 0 ? (
              filtered.map((app) => {
                const isSelected = selectedApp?.id === app.id;
                return (
                  <div
                    key={app.id}
                    onClick={() => setSelectedApp(app)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer group active:scale-[0.99] ${
                      isSelected
                        ? "bg-blue-50/70 dark:bg-blue-950/30 border-blue-500/80 ring-1 ring-blue-500/50 shadow-xs"
                        : "bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {app.name}
                          </h3>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 uppercase">
                            {app.plan}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium pt-0.5">
                          {app.masterName} · {app.city} / {app.district}
                        </p>
                      </div>

                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          app.status === "approved"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : app.status === "rejected"
                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {app.status === "approved"
                          ? "Onaylı"
                          : app.status === "rejected"
                          ? "Reddedildi"
                          : "Bekliyor"}
                      </span>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-400">
                      <span>{app.phone}</span>
                      <span>{new Date(app.createdAt).toLocaleDateString("tr-TR")}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-center text-slate-400">
                Kriterlere uygun başvuru bulunamadı.
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Detail Dossier Workstation) - 7 Cols */}
        <div className="lg:col-span-7 sticky top-20">
          {selectedApp ? (
            <div className="p-5 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-4">
              {/* Dossier Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      Aktif İnceleme Dosyası
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      #{selectedApp.id.slice(-6).toUpperCase()}
                    </span>
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                    {selectedApp.name}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {selectedApp.masterName} · {selectedApp.category.toUpperCase()} · {selectedApp.experienceYears || 10} Yıl Tecrübe
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-[0.98]"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Tam Ekran Çekmeceyi Aç</span>
                  </button>
                </div>
              </div>

              {/* Dossier Quick Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">İletişim & WhatsApp</span>
                  <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white block">
                    {selectedApp.phone}
                  </span>
                  <a
                    href={`https://wa.me/90${selectedApp.phone.replace(/\D/g, "").replace(/^0/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span>Doğrudan WhatsApp ↗</span>
                  </a>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Lokasyon & Harita</span>
                  <span className="font-bold text-slate-900 dark:text-white block truncate">
                    {selectedApp.city} / {selectedApp.district}
                  </span>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${selectedApp.name} ${selectedApp.address}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Haritada Doğrula ↗</span>
                  </a>
                </div>
              </div>

              {/* Services List Preview */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider block">
                  Tanımlanan Fiyat Menüsü:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(selectedApp.servicesParsed || []).map((s: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs"
                    >
                      <span className="font-bold text-slate-800 dark:text-slate-200">{s.name}</span>
                      <span className="font-mono tabular-nums font-extrabold text-blue-600 dark:text-blue-400">
                        {s.minPrice} ₺ {s.maxPrice && s.maxPrice !== s.minPrice ? `- ${s.maxPrice} ₺` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Banner */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Klavye Kısayolları ile Hızlı Karar
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    &apos;A&apos; tuşuna basarak onaylayın, &apos;R&apos; tuşuna basarak reddedin.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(true)}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-xs hover:bg-blue-700 transition-colors"
                >
                  Dosyayı İncele
                </button>
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-center text-slate-400">
              İncelemek için sol listeden bir başvuru seçin.
            </div>
          )}
        </div>
      </div>

      {/* Deep Inspection Drawer Modal */}
      <MerchantApplicationDrawer
        application={selectedApp}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onApproved={() => {
          onDataChanged?.();
        }}
        onRejected={() => {
          onDataChanged?.();
        }}
      />
    </div>
  );
}
