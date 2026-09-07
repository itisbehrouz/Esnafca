"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { EsnafcaCommandPalette } from "@/components/admin/EsnafcaCommandPalette";
import { AdminNotificationDrawer } from "@/components/admin/AdminNotificationDrawer";
import { getAdminNotifications } from "@/app/actions/admin";
import { Bell, Sparkles } from "lucide-react";

const READ_STORAGE_KEY = "esnafca_read_notifications";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingApplicationsCount, setPendingApplicationsCount] = useState(0);
  const [liveToast, setLiveToast] = useState<{ message: string; id: string } | null>(null);

  // Helper to calculate true unread count against localStorage
  const calculateUnread = (items: Array<{ id: string }>) => {
    try {
      const stored = localStorage.getItem(READ_STORAGE_KEY);
      const readSet = stored ? new Set(JSON.parse(stored)) : new Set();
      return items.filter((item) => !readSet.has(item.id)).length;
    } catch {
      return items.length;
    }
  };

  // Initial notification and pending count load
  const syncNotifications = useCallback(async () => {
    try {
      const res = await getAdminNotifications();
      if (res.success && res.data) {
        const trueUnread = calculateUnread(res.data);
        setUnreadCount(trueUnread);
        if (typeof res.pendingApplicationsCount === "number") {
          setPendingApplicationsCount(res.pendingApplicationsCount);
        }
      }
    } catch {
      // Non-blocking
    }
  }, []);

  useEffect(() => {
    syncNotifications();
  }, [syncNotifications]);

  // Listen to application updates across windows
  useEffect(() => {
    const handleApplicationUpdate = () => {
      syncNotifications();
    };

    window.addEventListener("applications_updated", handleApplicationUpdate);
    window.addEventListener("application_updated", handleApplicationUpdate);
    return () => {
      window.removeEventListener("applications_updated", handleApplicationUpdate);
      window.removeEventListener("application_updated", handleApplicationUpdate);
    };
  }, [syncNotifications]);

  // Server-Sent Events (SSE) live telemetry stream connection
  useEffect(() => {
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource("/api/admin/sse", { withCredentials: true });

      eventSource.addEventListener("init", (e) => {
        try {
          const data = JSON.parse(e.data);
          if (typeof data.pendingCount === "number") {
            setPendingApplicationsCount(data.pendingCount);
          }
          syncNotifications();
        } catch {}
      });

      eventSource.addEventListener("pulse", (e) => {
        try {
          const data = JSON.parse(e.data);
          if (typeof data.pendingCount === "number") {
            setPendingApplicationsCount(data.pendingCount);
          }
        } catch {}
      });

      eventSource.addEventListener("new_application", (e) => {
        try {
          const data = JSON.parse(e.data);
          const count = data.newCount || 1;
          const msg = `${count} yeni esnaf başvurusu sisteme ulaştı.`;

          setLiveToast({ message: msg, id: String(Date.now()) });
          setUnreadCount((prev) => prev + count);
          if (typeof data.totalPending === "number") {
            setPendingApplicationsCount(data.totalPending);
          } else {
            setPendingApplicationsCount((prev) => prev + count);
          }

          setTimeout(() => {
            setLiveToast(null);
          }, 5000);
        } catch {}
      });

      eventSource.onerror = () => {
        // Browser handles auto-reconnect
      };
    } catch (err) {
      console.warn("SSE connection could not be established; falling back to periodic sync:", err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [syncNotifications]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020617] text-slate-900 dark:text-white font-sans antialiased transition-colors duration-200 selection:bg-blue-600 selection:text-white">
      {/* Live SSE Notification Toast */}
      {liveToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white px-5 py-3 rounded-full text-xs font-bold shadow-2xl flex items-center gap-2.5 border border-blue-400 animate-in slide-in-from-top duration-300">
          <Bell className="w-4 h-4 text-amber-300 animate-bounce" />
          <span>{liveToast.message}</span>
          <button
            type="button"
            onClick={() => {
              setLiveToast(null);
              setIsDrawerOpen(true);
            }}
            className="ml-2 px-2.5 py-0.5 rounded-full bg-white text-blue-600 text-[10px] font-extrabold hover:bg-slate-100"
          >
            İncele ↗
          </button>
        </div>
      )}

      {/* 1. Left Operator Workstation Sidebar */}
      <AdminSidebar
        pendingCount={pendingApplicationsCount}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* 2. Top Header with Quick Search and Alert Bell */}
      <AdminHeader
        sidebarCollapsed={sidebarCollapsed}
        onOpenCommandPalette={() => setIsPaletteOpen(true)}
        onOpenNotifications={() => setIsDrawerOpen(true)}
        unreadCount={unreadCount}
      />

      {/* 3. Main Workstation Canvas */}
      <main
        className={`p-6 transition-all duration-200 min-h-[calc(100vh-64px)] ${
          sidebarCollapsed ? "ml-[72px]" : "ml-[240px]"
        }`}
      >
        <div className="max-w-7xl mx-auto space-y-6">{children}</div>
      </main>

      {/* 4. Global Modals: Command Palette (⌘K) & Notification Drawer */}
      <EsnafcaCommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        onOpen={() => setIsPaletteOpen(true)}
      />

      <AdminNotificationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onUpdateBadge={(count) => setUnreadCount(count)}
      />
    </div>
  );
}
