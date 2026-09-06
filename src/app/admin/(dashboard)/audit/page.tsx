"use client";

import React, { useState, useEffect } from "react";
import { History, RefreshCw, ShieldCheck } from "lucide-react";
import { getAdminAuditLogs } from "@/app/actions/admin";
import { AuditLogViewer } from "@/components/admin/AuditLogViewer";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadLogs = async () => {
    try {
      const res = await getAdminAuditLogs(100);
      if (res.success && res.data) {
        setLogs(res.data);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-xs font-mono text-slate-400">
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
        <span>Denetim Kütüğü Yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
              Operatör Denetim Kütüğü (Audit Trail)
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Zero-Trust güvenlik standartlarında tüm yönetici onay, ret, paket değişikliği ve silme işlemlerinin kayıtları.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full text-xs font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Kayıtlar Değiştirilemez</span>
          </span>

          <button
            type="button"
            onClick={() => {
              setIsRefreshing(true);
              loadLogs();
            }}
            disabled={isRefreshing}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Kütüğü Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-blue-500" : ""}`} />
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <AuditLogViewer logs={logs} />
    </div>
  );
}
