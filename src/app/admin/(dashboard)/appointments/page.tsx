"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  CalendarCheck, 
  RefreshCw, 
  Search, 
  Phone, 
  MessageCircle, 
  Store, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Tag, 
  ExternalLink 
} from "lucide-react";
import { getAdminAppointments, updateAppointmentStatusAction } from "@/app/actions/admin";

export default function AppointmentsDeskPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isMutating, setIsMutating] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadAppointments = async () => {
    try {
      const res = await getAdminAppointments("all");
      if (res.success && res.data) {
        setAppointments(res.data);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleStatusChange = async (
    appointmentId: string,
    newStatus: "pending" | "confirmed" | "completed" | "cancelled"
  ) => {
    setIsMutating(appointmentId);
    try {
      const res = await updateAppointmentStatusAction(appointmentId, newStatus);
      if (res.success) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === appointmentId ? { ...a, status: newStatus } : a))
        );
        showToast(`Randevu durumu '${newStatus.toUpperCase()}' olarak güncellendi.`);
      } else {
        showToast("Hata: " + res.error);
      }
    } catch {
      showToast("Durum güncellenemedi.");
    } finally {
      setIsMutating(null);
    }
  };

  const filtered = useMemo(() => {
    return appointments.filter((a) => {
      if (selectedStatus !== "all" && a.status !== selectedStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          a.customerName.toLowerCase().includes(q) ||
          a.customerPhone.includes(q) ||
          a.merchant?.name?.toLowerCase().includes(q) ||
          a.date.includes(q)
        );
      }
      return true;
    });
  }, [appointments, selectedStatus, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-xs font-mono text-slate-400">
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
        <span>Randevu Masası Yükleniyor...</span>
      </div>
    );
  }

  const pendingCount = appointments.filter((a) => a.status === "pending").length;

  return (
    <div className="space-y-4 font-sans select-none">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-full text-xs font-bold shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
              Randevu & Talep Takip Masası
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Müşterilerin esnaflardan aldığı randevu taleplerini, durumlarını ve saatlerini denetleyin.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            {pendingCount} Bekleyen Randevu
          </span>

          <button
            type="button"
            onClick={() => {
              setIsRefreshing(true);
              loadAppointments();
            }}
            disabled={isRefreshing}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Listeyi Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-blue-500" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Müşteri adı, telefon veya esnaf ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
            {["all", "pending", "confirmed", "completed", "cancelled"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                  selectedStatus === st
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {st === "all"
                  ? "Tümü"
                  : st === "pending"
                  ? "Bekleyen"
                  : st === "confirmed"
                  ? "Onaylı"
                  : st === "completed"
                  ? "Tamam"
                  : "İptal"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3 px-4 font-bold">Müşteri</th>
                <th className="py-3 px-4 font-bold">Esnaf & Usta</th>
                <th className="py-3 px-4 font-bold">Hizmet / Kalem</th>
                <th className="py-3 px-4 font-bold">Tarih & Saat</th>
                <th className="py-3 px-4 font-bold">Fiyat</th>
                <th className="py-3 px-4 font-bold">Durum</th>
                <th className="py-3 px-4 font-bold text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filtered.length > 0 ? (
                filtered.map((apt) => {
                  const isBusy = isMutating === apt.id;
                  const waClean = apt.customerPhone.replace(/\D/g, "");
                  const waLink = waClean.startsWith("90")
                    ? `https://wa.me/${waClean}`
                    : `https://wa.me/90${waClean.replace(/^0/, "")}`;

                  return (
                    <tr
                      key={apt.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Customer */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {apt.customerName}
                          </span>
                          <div className="flex items-center gap-2 text-[11px] font-mono tabular-nums text-slate-500">
                            <span>{apt.customerPhone}</span>
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>WhatsApp</span>
                            </a>
                          </div>
                        </div>
                      </td>

                      {/* Merchant */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          {apt.merchant ? (
                            <Link
                              href={`/esnaf/${apt.merchant.slug}`}
                              target="_blank"
                              className="font-bold text-slate-900 dark:text-white hover:text-blue-600 flex items-center gap-1"
                            >
                              <Store className="w-3.5 h-3.5 text-blue-500" />
                              <span>{apt.merchant.name}</span>
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </Link>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                          <span className="text-[11px] text-slate-500 block">
                            {apt.merchant?.city} / {apt.merchant?.district}
                          </span>
                        </div>
                      </td>

                      {/* Service */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                          {apt.service?.name || "Standart Hizmet"}
                        </span>
                      </td>

                      {/* Date & Time */}
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {apt.date} · {apt.startTime}
                            {apt.endTime ? ` - ${apt.endTime}` : ""}
                          </span>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4 font-mono tabular-nums font-extrabold text-blue-600 dark:text-blue-400">
                        {apt.price} ₺
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            apt.status === "confirmed"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : apt.status === "completed"
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                              : apt.status === "cancelled"
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {apt.status === "confirmed"
                            ? "Onaylandı"
                            : apt.status === "completed"
                            ? "Tamamlandı"
                            : apt.status === "cancelled"
                            ? "İptal Edildi"
                            : "Bekliyor"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {apt.status !== "confirmed" && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleStatusChange(apt.id, "confirmed")}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                              Onayla
                            </button>
                          )}

                          {apt.status !== "completed" && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleStatusChange(apt.id, "completed")}
                              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                              Tamamla
                            </button>
                          )}

                          {apt.status !== "cancelled" && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleStatusChange(apt.id, "cancelled")}
                              className="px-2.5 py-1 rounded-lg border border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[11px] font-bold transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                              İptal
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Kriterlere uygun randevu kaydı bulunamadı.
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
