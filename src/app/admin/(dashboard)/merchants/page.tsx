"use client";

import React, { useState, useEffect } from "react";
import { Store, RefreshCw } from "lucide-react";
import { getAdminMerchants } from "@/app/actions/admin";
import { MerchantsMasterTable } from "@/components/admin/MerchantsMasterTable";
import type { Merchant } from "@/types";

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadMerchants = async () => {
    try {
      const res = await getAdminMerchants();
      if (res.success && res.data) {
        setMerchants(res.data);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadMerchants();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-xs font-mono text-slate-400">
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
        <span>Esnaf Listesi Yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
              Esnaflar Master Tablosu
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Sistemdeki tüm onaylı dükkanları yönetin, paketleri güncelleyin ve CSV olarak dışa aktarın.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsRefreshing(true);
            loadMerchants();
          }}
          disabled={isRefreshing}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors self-start sm:self-center"
          title="Listeyi Yenile"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-blue-500" : ""}`} />
        </button>
      </div>

      {/* Table Component */}
      <MerchantsMasterTable
        merchants={merchants}
        onDataChanged={() => loadMerchants()}
      />
    </div>
  );
}
