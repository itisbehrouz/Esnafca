"use client";

import React, { useState, useMemo } from "react";
import { 
  History, 
  Search, 
  Filter, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Send, 
  MessageSquare,
  FileText,
  UserCheck
} from "lucide-react";

interface AuditLogItem {
  id: string;
  operator: string;
  action: string;
  targetType: string;
  targetId: string;
  details?: string | null;
  detailsParsed?: any;
  ipAddress?: string | null;
  createdAt: string | Date;
}

interface AuditLogViewerProps {
  logs: AuditLogItem[];
}

export function AuditLogViewer({ logs }: AuditLogViewerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAction, setSelectedAction] = useState("all");

  const getActionBadge = (action: string) => {
    switch (action) {
      case "APPROVE_APPLICATION":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Başvuru Onayı</span>
          </span>
        );
      case "REJECT_APPLICATION":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 inline-flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            <span>Başvuru Reddi</span>
          </span>
        );
      case "UPDATE_TIER":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 inline-flex items-center gap-1">
            <UserCheck className="w-3 h-3" />
            <span>Paket Güncellemesi</span>
          </span>
        );
      case "TOGGLE_VERIFIED":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 inline-flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            <span>Rozet Değişimi</span>
          </span>
        );
      case "MODERATE_REVIEW":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 inline-flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            <span>Yorum Moderasyonu</span>
          </span>
        );
      case "BROADCAST_SENT":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 inline-flex items-center gap-1">
            <Send className="w-3 h-3" />
            <span>Toplu Duyuru</span>
          </span>
        );
      case "DELETE_MERCHANT":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 inline-flex items-center gap-1">
            <Trash2 className="w-3 h-3" />
            <span>Esnaf Silindi</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-slate-500/10 text-slate-500 border border-slate-500/20">
            {action}
          </span>
        );
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (selectedAction !== "all" && log.action !== selectedAction) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const detailsStr = typeof log.details === "string" ? log.details.toLowerCase() : "";
        return (
          log.operator.toLowerCase().includes(q) ||
          log.targetId.toLowerCase().includes(q) ||
          detailsStr.includes(q)
        );
      }
      return true;
    });
  }, [logs, selectedAction, searchQuery]);

  return (
    <div className="space-y-4 font-sans select-none">
      {/* Search & Filter Header */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Operatör adı, hedef ID veya işlem detayı ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="p-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">Tüm Eylemler</option>
              <option value="APPROVE_APPLICATION">Başvuru Onayı</option>
              <option value="REJECT_APPLICATION">Başvuru Reddi</option>
              <option value="UPDATE_TIER">Paket Değişimi</option>
              <option value="TOGGLE_VERIFIED">Rozet Değişimi</option>
              <option value="MODERATE_REVIEW">Yorum Moderasyonu</option>
              <option value="BROADCAST_SENT">Toplu Duyuru</option>
              <option value="DELETE_MERCHANT">Esnaf Silme</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3 px-4 font-bold">Tarih & Saat</th>
                <th className="py-3 px-4 font-bold">Operatör</th>
                <th className="py-3 px-4 font-bold">İşlem / Eylem</th>
                <th className="py-3 px-4 font-bold">Hedef</th>
                <th className="py-3 px-4 font-bold">Açıklama & Parametreler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => {
                  let parsedDetails: any = null;
                  try {
                    parsedDetails = typeof log.details === "string" ? JSON.parse(log.details) : log.details;
                  } catch {}

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Timestamp */}
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {new Date(log.createdAt).toLocaleString("tr-TR", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Operator */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {log.operator}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4">
                        {getActionBadge(log.action)}
                      </td>

                      {/* Target */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold mr-1">
                          {log.targetType}
                        </span>
                        <span>#{log.targetId.slice(-8)}</span>
                      </td>

                      {/* Details */}
                      <td className="py-3 px-4">
                        {parsedDetails ? (
                          <div className="space-y-0.5 max-w-md">
                            {parsedDetails.merchantName && (
                              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                                Esnaf: {parsedDetails.merchantName}
                              </span>
                            )}
                            {parsedDetails.notes && (
                              <span className="text-slate-500 text-[11px] block">
                                Not: {parsedDetails.notes}
                              </span>
                            )}
                            {parsedDetails.reason && (
                              <span className="text-rose-600 dark:text-rose-400 text-[11px] block">
                                Gerekçe: {parsedDetails.reason}
                              </span>
                            )}
                            {parsedDetails.previousTier && parsedDetails.newTier && (
                              <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400 block">
                                {parsedDetails.previousTier} &rarr; {parsedDetails.newTier}
                              </span>
                            )}
                            {parsedDetails.messageSnippet && (
                              <span className="text-slate-500 text-[11px] block truncate">
                                &quot;{parsedDetails.messageSnippet}&quot;
                              </span>
                            )}
                          </div>
                        ) : log.details ? (
                          <span className="text-slate-600 dark:text-slate-300 text-[11px]">
                            {log.details}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Arama kriterine uygun denetim kaydı bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
