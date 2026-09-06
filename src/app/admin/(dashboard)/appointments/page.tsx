"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  CalendarCheck, 
  RefreshCw, 
  Search, 
  Store, 
  Clock, 
  ExternalLink,
  MessageCircle,
  TrendingUp,
  Coins,
  CheckCircle,
  AlertCircle,
  Info
} from "lucide-react";
import { getAdminAppointments } from "@/app/actions/admin";

export default function AppointmentsDeskPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

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

  const filtered = useMemo(() => {
    return appointments.filter((a) => {
      if (selectedStatus !== "all" && a.status !== selectedStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          a.customerName?.toLowerCase().includes(q) ||
          a.customerPhone?.includes(q) ||
          a.merchant?.name?.toLowerCase().includes(q) ||
          a.date?.includes(q)
        );
      }
      return true;
    });
  }, [appointments, selectedStatus, searchQuery]);

  // Analytics Metrics (Read-only)
  const totalCount = appointments.length;
  const totalValue = appointments.reduce((sum, a) => sum + (Number(a.price) || 0), 0);
  const completedCount = appointments.filter((a) => a.status === "completed" || a.status === "confirmed").length;
  const pendingCount = appointments.filter((a) => a.status === "pending").length;
  const cancelledCount = appointments.filter((a) => a.status === "cancelled").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-xs font-mono text-slate-400">
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
        <span>Randevu İstatistikleri Yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5 font-sans select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800/80 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                Randevu & Talep İstatistik Masası
              </h1>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Salt Okunur Telemetri
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Platform üzerinden üretilen müşteri talep hacmini ve esnafa kazandırılan iş değerini izleyin.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setIsRefreshing(true);
              loadAppointments();
            }}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50"
            title="Verileri Yenile"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-blue-500" : ""}`} />
            <span>Yenile</span>
          </button>
        </div>
      </div>

      {/* Strategic Notice Banner */}
      <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-blue-900 dark:text-blue-200">
          <span className="font-extrabold block">Dükkan & Esnaf İnisiyatifi Prensibi</span>
          <p className="text-[11px] leading-relaxed text-blue-800/80 dark:text-blue-300/80">
            Randevu teyidi, saat belirleme, kabul ve iptal süreçleri doğrudan dükkan sahibi esnaf ile müşteri arasındadır. 
            Şirket operatörleri bu masada işlem yapmaz; veriler platformun mahalle ekonomisine sağladığı katma değeri ve talep yoğunluğunu analiz etmek amacıyla salt okunur olarak tutulmaktadır.
          </p>
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider">Toplam Talep</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
            {totalCount}
          </div>
          <span className="text-[10px] text-slate-400 block">Sistem geneli kayıtlı talep</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider">Üretilen Ciro Hacmi</span>
            <Coins className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-extrabold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            {totalValue.toLocaleString("tr-TR")} ₺
          </div>
          <span className="text-[10px] text-slate-400 block">Esnafa yönlendirilen iş hacmi</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider">Tamamlanan / Onaylı</span>
            <CheckCircle className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-extrabold font-mono tabular-nums text-blue-600 dark:text-blue-400">
            {completedCount}
          </div>
          <span className="text-[10px] text-slate-400 block">
            %{totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0} gerçekleşme oranı
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider">Bekleyen / İptal</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
            {pendingCount} <span className="text-xs font-normal text-slate-400 font-sans">bekleyen</span> / {cancelledCount} <span className="text-xs font-normal text-rose-500 font-sans">iptal</span>
          </div>
          <span className="text-[10px] text-slate-400 block">Esnaf onay/yanıt akışı</span>
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

      {/* Read-Only Appointments List */}
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
                <th className="py-3 px-4 font-bold">Esnaf Tarafı Durumu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filtered.length > 0 ? (
                filtered.map((apt) => {
                  const waClean = apt.customerPhone ? apt.customerPhone.replace(/\D/g, "") : "";
                  const waLink = waClean.startsWith("90")
                    ? `https://wa.me/${waClean}`
                    : `https://wa.me/90${waClean.replace(/^0/, "")}`;

                  return (
                    <tr
                      key={apt.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {apt.customerName}
                          </span>
                          <div className="flex items-center gap-2 text-[11px] font-mono tabular-nums text-slate-500">
                            <span>{apt.customerPhone}</span>
                            {waClean && (
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 text-[10px]"
                                title="Müşteri Hizmetleri İletişimi"
                              >
                                <MessageCircle className="w-3 h-3" />
                                <span>WhatsApp</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Merchant */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          {apt.merchant ? (
                            <Link
                              href={`/esnaf/${apt.merchant.slug}`}
                              target="_blank"
                              className="font-bold text-slate-900 dark:text-white hover:text-blue-600 flex items-center gap-1"
                            >
                              <Store className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              <span>{apt.merchant.name}</span>
                              <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
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
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                          {apt.service?.name || "Standart Hizmet"}
                        </span>
                      </td>

                      {/* Date & Time */}
                      <td className="py-3.5 px-4 font-mono tabular-nums text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            {apt.date} · {apt.startTime}
                            {apt.endTime ? ` - ${apt.endTime}` : ""}
                          </span>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 font-mono tabular-nums font-extrabold text-blue-600 dark:text-blue-400">
                        {apt.price} ₺
                      </td>

                      {/* Read-Only Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
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
                            ? "Esnaf Onayladı"
                            : apt.status === "completed"
                            ? "Tamamlandı"
                            : apt.status === "cancelled"
                            ? "İptal Edildi"
                            : "Esnaf Onayı Bekliyor"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Kayıtlı randevu veya talep verisi bulunamadı.
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
