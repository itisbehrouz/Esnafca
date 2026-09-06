"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { 
  Search, 
  Store, 
  Clock, 
  Send, 
  MessageSquare, 
  History, 
  ExternalLink,
  Zap,
  LayoutDashboard,
  CalendarCheck
} from "lucide-react";
import { CATEGORIES } from "@/data/categories";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen?: () => void;
}

export function EsnafcaCommandPalette({
  isOpen,
  onClose,
  onOpen,
}: CommandPaletteProps) {
  const router = useRouter();
  const [merchants, setMerchants] = useState<
    Array<{
      id: string;
      name: string;
      masterName: string;
      category: string;
      district: string;
      slug: string;
    }>
  >([]);

  // Keyboard shortcut listener for Cmd+K / Ctrl+K and Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isK = e.code === "KeyK" || e.key.toLowerCase() === "k";
      const isModifierPressed = e.metaKey || e.ctrlKey;

      if (isModifierPressed && isK) {
        e.preventDefault();
        e.stopPropagation();
        if (isOpen) {
          onClose();
        } else if (onOpen) {
          onOpen();
        }
        return;
      }

      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen, onClose, onOpen]);

  // Load merchants on palette open for fast search
  useEffect(() => {
    if (isOpen) {
      fetch("/api/merchants")
        .then((res) => res.json())
        .then((json) => {
          if (json.success && Array.isArray(json.data)) {
            setMerchants(
              json.data.map((m: any) => ({
                id: m.id,
                name: m.name,
                masterName: m.masterName,
                category: m.category,
                district: m.district,
                slug: m.slug,
              }))
            );
          }
        })
        .catch(() => null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const navigateTo = (path: string) => {
    onClose();
    router.push(path);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 font-sans select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Dialog Window */}
      <div className="relative w-full max-w-xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in zoom-in-95 duration-150 text-slate-900 dark:text-slate-100">
        <Command label="Esnafça Komut Paleti" className="w-full">
          {/* Search Header */}
          <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <Search className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
            <Command.Input
              autoFocus
              placeholder="Esnaf, kategori, ilçe veya operasyon masası ara... (örn: berber, Kadıköy, randevu)"
              className="w-full bg-transparent text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
            />
            <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded text-[10px] font-mono text-slate-500 dark:text-slate-400 shrink-0 ml-2">
              ESC
            </kbd>
          </div>

          {/* Results List */}
          <Command.List className="max-h-80 overflow-y-auto p-2 space-y-1">
            <Command.Empty className="p-6 text-center text-xs text-slate-500">
              Arama kriterine uygun sonuç bulunamadı.
            </Command.Empty>

            {/* Quick Desk Navigation */}
            <Command.Group
              heading="Operasyon Masaları"
              className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1.5"
            >
              <Command.Item
                onSelect={() => navigateTo("/admin")}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-blue-600 hover:text-white cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4 text-blue-500" />
                  <span>Genel Bakış & Bento KPI Paneli</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">/admin</span>
              </Command.Item>

              <Command.Item
                onSelect={() => navigateTo("/admin/applications")}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-blue-600 hover:text-white cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>Onay Masası (Triage Workstation)</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">/admin/applications</span>
              </Command.Item>

              <Command.Item
                onSelect={() => navigateTo("/admin/merchants")}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-blue-600 hover:text-white cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-blue-500" />
                  <span>Esnaflar Master Tablosu</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">/admin/merchants</span>
              </Command.Item>

              <Command.Item
                onSelect={() => navigateTo("/admin/appointments")}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-blue-600 hover:text-white cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-emerald-500" />
                  <span>Randevu & Talep Takip Masası</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">/admin/appointments</span>
              </Command.Item>

              <Command.Item
                onSelect={() => navigateTo("/admin/reviews")}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-blue-600 hover:text-white cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-purple-500" />
                  <span>Müşteri Yorum Moderasyonu</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">/admin/reviews</span>
              </Command.Item>

              <Command.Item
                onSelect={() => navigateTo("/admin/broadcast")}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-blue-600 hover:text-white cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-emerald-500" />
                  <span>Toplu WhatsApp & SMS Duyuru Masası</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">/admin/broadcast</span>
              </Command.Item>

              <Command.Item
                onSelect={() => navigateTo("/admin/audit")}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-blue-600 hover:text-white cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-rose-500" />
                  <span>Operatör Denetim Kütüğü (Audit Trail)</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">/admin/audit</span>
              </Command.Item>
            </Command.Group>

            {/* Live Merchants Search */}
            {merchants.length > 0 && (
              <Command.Group
                heading="Canlı Esnaflar"
                className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1.5"
              >
                {merchants.slice(0, 8).map((m) => (
                  <Command.Item
                    key={m.id}
                    onSelect={() => {
                      onClose();
                      window.open(`/esnaf/${m.slug}`, "_blank");
                    }}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-blue-600 hover:text-white cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Store className="w-3.5 h-3.5 text-blue-500" />
                      <div>
                        <span className="block font-bold">{m.name}</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {m.masterName} · {m.district} ({m.category})
                        </span>
                      </div>
                    </div>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Popular Categories */}
            <Command.Group
              heading="Kategoriler"
              className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1.5"
            >
              {CATEGORIES.slice(0, 5).map((cat) => (
                <Command.Item
                  key={cat.id}
                  onSelect={() => navigateTo(`/admin/merchants?category=${cat.id}`)}
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-blue-600 hover:text-white cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>{cat.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">Kategori Filtresi</span>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>

          {/* Footer */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono text-[10px]">
                  ↑↓
                </kbd>{" "}
                Gezin
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono text-[10px]">
                  ↵
                </kbd>{" "}
                Seç
              </span>
            </div>
            <span className="font-mono text-[10px]">Esnafça HQ · ⌘K</span>
          </div>
        </Command>
      </div>
    </div>
  );
}
