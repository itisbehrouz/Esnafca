"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Bell, 
  X, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  Shield, 
  ExternalLink 
} from "lucide-react";
import { getAdminNotifications } from "@/app/actions/admin";

const READ_STORAGE_KEY = "esnafca_read_notifications";

interface NotificationItem {
  id: string;
  category: string;
  title: string;
  message: string;
  targetUrl: string | null;
  createdAt: string;
  severity: string;
}

interface AdminNotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateBadge?: (count: number) => void;
}

export function AdminNotificationDrawer({
  isOpen,
  onClose,
  onUpdateBadge,
}: AdminNotificationDrawerProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  // Load persisted read notification IDs from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(READ_STORAGE_KEY);
      if (stored) {
        setReadIds(new Set(JSON.parse(stored)));
      }
    } catch {}
  }, []);

  // Escape key closes notification drawer
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const loadNotifications = async () => {
    try {
      const res = await getAdminNotifications();
      if (res.success && res.data) {
        setNotifications(res.data);

        // Recalculate true unread count by checking against readIds
        let currentRead = readIds;
        try {
          const stored = localStorage.getItem(READ_STORAGE_KEY);
          if (stored) {
            currentRead = new Set(JSON.parse(stored));
            setReadIds(currentRead);
          }
        } catch {}

        const unreadItems = res.data.filter((n: NotificationItem) => !currentRead.has(n.id));
        onUpdateBadge?.(unreadItems.length);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = notifications.filter((n) => {
    if (selectedCategory === "ALL") return true;
    return n.category === selectedCategory;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "APPLICATION":
        return <Clock className="w-4 h-4 text-amber-500" />;
      case "REVIEW":
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case "SECURITY":
        return <Shield className="w-4 h-4 text-emerald-500" />;
      default:
        return <Bell className="w-4 h-4 text-zinc-400" />;
    }
  };

  const markAllRead = () => {
    const allIds = new Set([...Array.from(readIds), ...notifications.map((n) => n.id)]);
    setReadIds(allIds);
    try {
      localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(Array.from(allIds)));
    } catch {}
    onUpdateBadge?.(0);
  };

  const markSingleRead = (id: string, targetUrl: string | null) => {
    const updated = new Set(readIds).add(id);
    setReadIds(updated);
    try {
      localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(Array.from(updated)));
    } catch {}

    const remainingUnread = notifications.filter((n) => !updated.has(n.id)).length;
    onUpdateBadge?.(remainingUnread);

    if (targetUrl) {
      onClose();
      router.push(targetUrl);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-[#0B1120] border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transition-all animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Operatör Bildirim Kütüğü</h2>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  {notifications.length} Canlı Uyarı Kaydı
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={markAllRead}
                className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline px-2 py-1"
              >
                Tümünü Okundu Say
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                title="Kapat (ESC)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Category Filters */}
          <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
            {["ALL", "APPLICATION", "REVIEW", "SECURITY"].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-[11px] transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? "bg-blue-600 text-white font-bold shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {cat === "ALL"
                  ? "Tümü"
                  : cat === "APPLICATION"
                  ? "Başvurular"
                  : cat === "REVIEW"
                  ? "Yorumlar"
                  : "Güvenlik"}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filtered.length > 0 ? (
              filtered.map((item) => {
                const isRead = readIds.has(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => markSingleRead(item.id, item.targetUrl)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer group active:scale-[0.99] ${
                      isRead
                        ? "bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 opacity-60"
                        : "bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-700/80 shadow-xs hover:border-blue-500/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                        {getCategoryIcon(item.category)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {item.title}
                          </span>
                          <span className="text-[10px] font-mono tabular-nums text-slate-400 shrink-0">
                            {new Date(item.createdAt).toLocaleTimeString("tr-TR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1 leading-relaxed line-clamp-2">
                          {item.message}
                        </p>

                        {item.targetUrl && (
                          <div className="mt-2 flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 group-hover:underline">
                            <span>İncele</span>
                            <ExternalLink className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 opacity-60" />
                <p className="text-xs font-semibold">Tüm bildirimler güncel.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 text-center">
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
              Esnafça Operasyon Kontrol İstasyonu · Port 3005
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
