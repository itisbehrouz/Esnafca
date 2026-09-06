"use client";

import React, { useState, useEffect } from "react";
import { Clock, RefreshCw } from "lucide-react";
import { getAdminApplications } from "@/app/actions/admin";
import { WorkstationLayout } from "@/components/admin/WorkstationLayout";

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadApplications = async () => {
    try {
      const res = await getAdminApplications("all");
      if (res.success && res.data) {
        setApplications(res.data);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-xs font-mono text-slate-400">
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
        <span>Başvuru Masası Yükleniyor...</span>
      </div>
    );
  }

  const pendingCount = applications.filter((a) => a.status === "pending").length;

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
              Başvuru Onay Masası (Triage Workstation)
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Yeni esnaf ve zanaatkar dükkan kayıtlarını inceleyin, harita/telefon doğrulamasını yapın.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            {pendingCount} Bekleyen Başvuru
          </span>

          <button
            type="button"
            onClick={() => {
              setIsRefreshing(true);
              loadApplications();
            }}
            disabled={isRefreshing}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Listeyi Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-blue-500" : ""}`} />
          </button>
        </div>
      </div>

      {/* Master-Detail Workstation */}
      <WorkstationLayout
        applications={applications}
        onDataChanged={() => loadApplications()}
      />
    </div>
  );
}
