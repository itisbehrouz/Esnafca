"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Calendar,
  Clock,
  Check,
  CheckCircle2,
  X,
  Phone,
  MessageCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  User,
  RotateCcw,
  Sparkles,
  TrendingUp,
  FileText,
  CalendarCheck2,
  CalendarX2,
  Loader2,
  CreditCard,
} from "lucide-react";
import { Merchant, Appointment, AppointmentStatus } from "@/types";
import {
  getMerchantAppointmentsAction,
  updateAppointmentStatusAction,
} from "@/app/actions/appointment";
import { updateMerchantProfile } from "@/app/actions/merchant";
import {
  getBookingConfirmationCustomerMessage,
  getReminderCustomerMessage,
} from "@/lib/whatsapp-templates";

interface MerchantAppointmentsViewProps {
  merchant: Merchant;
  onMerchantUpdated?: (updatedMerchant: Merchant) => void;
}

const TURKISH_MONTHS = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

const TURKISH_DAYS = [
  "Pazar",
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
];

function getTodayStr(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getOffsetDateStr(baseDateStr: string, offsetDays: number): string {
  const [y, m, d] = baseDateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + offsetDays);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const todayStr = getTodayStr();
  const tomorrowStr = getOffsetDateStr(todayStr, 1);

  let label = "";
  if (dateStr === todayStr) label = " (Bugün)";
  else if (dateStr === tomorrowStr) label = " (Yarın)";

  return `${date.getDate()} ${TURKISH_MONTHS[date.getMonth()]} ${date.getFullYear()}, ${
    TURKISH_DAYS[date.getDay()]
  }${label}`;
}

export function MerchantAppointmentsView({
  merchant,
  onMerchantUpdated,
}: MerchantAppointmentsViewProps) {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<"all" | AppointmentStatus>("all");

  // Settings Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [slotInterval, setSlotInterval] = useState<number>(
    merchant.features?.slotInterval || 30
  );
  const [bufferTime, setBufferTime] = useState<number>(
    merchant.features?.bufferTime || 5
  );
  const [maxAdvanceDays, setMaxAdvanceDays] = useState<number>(
    merchant.features?.maxAdvanceDays || 14
  );
  const [iban, setIban] = useState<string>(merchant.features?.iban || "");
  const [depositNote, setDepositNote] = useState<string>(
    merchant.features?.depositNote || ""
  );
  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fetch appointments for selected date
  const loadAppointments = useCallback(async (date: string) => {
    setIsLoading(true);
    try {
      const res = await getMerchantAppointmentsAction(merchant.id, date);
      if (res.success && Array.isArray(res.appointments)) {
        setAppointments(res.appointments as Appointment[]);
      } else {
        setAppointments([]);
      }
    } catch {
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  }, [merchant.id]);

  useEffect(() => {
    loadAppointments(selectedDate);
  }, [selectedDate, loadAppointments]);

  // Handle Status Update (Optimistic)
  const handleUpdateStatus = async (
    appointmentId: string,
    newStatus: AppointmentStatus
  ) => {
    // 1. Optimistic update
    const previous = [...appointments];
    setAppointments((prev) =>
      prev.map((a) => (a.id === appointmentId ? { ...a, status: newStatus } : a))
    );

    // 2. Server action
    const res = await updateAppointmentStatusAction(appointmentId, newStatus);
    if (res.success) {
      const statusLabels: Record<AppointmentStatus, string> = {
        pending: "Onay bekliyor olarak işaretlendi",
        confirmed: "Randevu onaylandı",
        completed: "Randevu tamamlandı olarak işaretlendi",
        cancelled: "Randevu iptal edildi",
      };
      showToast(statusLabels[newStatus] || "Randevu güncellendi.");
    } else {
      // Revert if error
      setAppointments(previous);
      alert(res.error || "Randevu durumu güncellenemedi.");
    }
  };

  // Handle Save Engine Settings
  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const updatedFeatures = {
        ...merchant.features,
        slotInterval,
        bufferTime,
        maxAdvanceDays,
        iban: iban.trim() || undefined,
        depositNote: depositNote.trim() || undefined,
      };

      const res = await updateMerchantProfile(merchant.id, {
        features: updatedFeatures,
      });

      if (res.success) {
        if (onMerchantUpdated) {
          onMerchantUpdated({
            ...merchant,
            features: updatedFeatures,
          });
        }
        setIsSettingsOpen(false);
        showToast("Randevu ve müsaitlik ayarları kaydedildi.");
      } else {
        alert(res.error || "Ayarlar kaydedilemedi.");
      }
    } catch {
      alert("Bağlantı hatası oluştu.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Calculate Metrics
  const metrics = useMemo(() => {
    const total = appointments.length;
    const pending = appointments.filter((a) => a.status === "pending").length;
    const confirmed = appointments.filter((a) => a.status === "confirmed").length;
    const completed = appointments.filter((a) => a.status === "completed").length;
    const cancelled = appointments.filter((a) => a.status === "cancelled").length;

    const estimatedRevenue = appointments
      .filter((a) => a.status === "confirmed" || a.status === "completed")
      .reduce((sum, a) => sum + (Number(a.price) || 0), 0);

    return { total, pending, confirmed, completed, cancelled, estimatedRevenue };
  }, [appointments]);

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    if (statusFilter === "all") return appointments;
    return appointments.filter((a) => a.status === statusFilter);
  }, [appointments, statusFilter]);

  const todayStr = getTodayStr();
  const tomorrowStr = getOffsetDateStr(todayStr, 1);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-black dark:bg-white text-white dark:text-black px-4 py-2.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Date Navigation & Actions Header */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-brand uppercase tracking-wider block">
              Randevu Ajandası
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-black dark:text-white">
              {formatDisplayDate(selectedDate)}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Date Buttons */}
            <button
              type="button"
              onClick={() => setSelectedDate(todayStr)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ios-press ${
                selectedDate === todayStr
                  ? "bg-brand text-white shadow-xs"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              Bugün
            </button>

            <button
              type="button"
              onClick={() => setSelectedDate(tomorrowStr)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ios-press ${
                selectedDate === tomorrowStr
                  ? "bg-brand text-white shadow-xs"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              Yarın
            </button>

            {/* Engine Settings Modal Trigger */}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 ios-press"
              title="Randevu Motoru Ayarları"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Date Selector Bar */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-black/[0.04] dark:border-white/[0.06]">
          <button
            type="button"
            onClick={() => setSelectedDate(getOffsetDateStr(selectedDate, -1))}
            className="p-2 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 flex items-center gap-1 text-xs font-bold ios-press"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Önceki Gün</span>
          </button>

          {/* Native HTML5 Date Picker Styled */}
          <div className="relative flex items-center">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="px-3.5 py-1.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-black/[0.04] dark:border-white/[0.08] text-xs font-bold text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-brand cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={() => setSelectedDate(getOffsetDateStr(selectedDate, 1))}
            className="p-2 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 flex items-center gap-1 text-xs font-bold ios-press"
          >
            <span className="hidden sm:inline">Sonraki Gün</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Daily Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Metric 1: Total */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Toplam</span>
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-black dark:text-white">
              {metrics.total}
            </span>
            <span className="text-[10px] font-medium text-zinc-400">randevu</span>
          </div>
        </div>

        {/* Metric 2: Confirmed */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-blue-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Onaylanan</span>
            <CalendarCheck2 className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-blue-600 dark:text-blue-400">
              {metrics.confirmed}
            </span>
            {metrics.pending > 0 && (
              <span className="text-[10px] font-bold text-amber-500">
                ({metrics.pending} bekleyen)
              </span>
            )}
          </div>
        </div>

        {/* Metric 3: Completed */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-emerald-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Tamamlanan</span>
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
              {metrics.completed}
            </span>
            <span className="text-[10px] font-medium text-zinc-400">hizmet</span>
          </div>
        </div>

        {/* Metric 4: Estimated Daily Revenue */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-brand">
            <span className="text-[10px] font-bold uppercase tracking-wider">Tahmini Ciro</span>
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-baseline gap-0.5">
            <span className="text-xl font-black text-brand">
              {metrics.estimatedRevenue}
            </span>
            <span className="text-xs font-extrabold text-brand">₺</span>
          </div>
        </div>
      </div>

      {/* 3. Filter Segment Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={`px-3 py-1.5 rounded-full font-bold transition-all shrink-0 ${
            statusFilter === "all"
              ? "bg-black dark:bg-white text-white dark:text-black shadow-xs"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
          }`}
        >
          Tümü ({metrics.total})
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("pending")}
          className={`px-3 py-1.5 rounded-full font-bold transition-all shrink-0 ${
            statusFilter === "pending"
              ? "bg-amber-500 text-white shadow-xs"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
          }`}
        >
          Bekleyen ({metrics.pending})
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("confirmed")}
          className={`px-3 py-1.5 rounded-full font-bold transition-all shrink-0 ${
            statusFilter === "confirmed"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
          }`}
        >
          Onaylanan ({metrics.confirmed})
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("completed")}
          className={`px-3 py-1.5 rounded-full font-bold transition-all shrink-0 ${
            statusFilter === "completed"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
          }`}
        >
          Tamamlanan ({metrics.completed})
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("cancelled")}
          className={`px-3 py-1.5 rounded-full font-bold transition-all shrink-0 ${
            statusFilter === "cancelled"
              ? "bg-rose-600 text-white shadow-xs"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
          }`}
        >
          İptal ({metrics.cancelled})
        </button>
      </div>

      {/* 4. Appointments Card List */}
      <div className="space-y-3">
        {isLoading ? (
          /* Loading Skeletons */
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-5 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] animate-pulse space-y-3"
              >
                <div className="flex justify-between items-center">
                  <div className="h-5 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                  <div className="h-5 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                </div>
                <div className="h-4 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
              </div>
            ))}
          </div>
        ) : filteredAppointments.length > 0 ? (
          filteredAppointments.map((appointment) => {
            const cleanPhone = appointment.customerPhone.replace(/\D/g, "");
            const isPending = appointment.status === "pending";
            const isConfirmed = appointment.status === "confirmed";
            const isCompleted = appointment.status === "completed";
            const isCancelled = appointment.status === "cancelled";

            // WhatsApp links to customer using templates
            const waCustomerConfirmUrl = getBookingConfirmationCustomerMessage(
              appointment.customerPhone,
              {
                ...appointment,
                merchant: {
                  name: merchant.name,
                  masterName: merchant.masterName,
                  address: merchant.address,
                },
              }
            );

            const waCustomerReminderUrl = getReminderCustomerMessage(
              appointment.customerPhone,
              {
                ...appointment,
                merchant: {
                  name: merchant.name,
                  masterName: merchant.masterName,
                  address: merchant.address,
                },
              }
            );

            return (
              <div
                key={appointment.id}
                className={`p-5 rounded-3xl bg-white dark:bg-[#1C1C1E] border shadow-xs transition-all space-y-3.5 ${
                  isPending
                    ? "border-amber-300 dark:border-amber-800/80 ring-1 ring-amber-400/30"
                    : isConfirmed
                    ? "border-blue-200 dark:border-blue-900/60"
                    : isCompleted
                    ? "border-emerald-200 dark:border-emerald-900/60 opacity-90"
                    : "border-black/[0.06] dark:border-white/[0.08] opacity-75"
                }`}
              >
                {/* Header: Time & Status Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white font-black text-xs sm:text-sm flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-brand" />
                      <span>
                        {appointment.startTime}
                        {appointment.endTime ? ` - ${appointment.endTime}` : ""}
                      </span>
                    </span>

                    <span className="text-[10px] font-mono text-zinc-400">
                      #{appointment.id.slice(-5).toUpperCase()}
                    </span>
                  </div>

                  {/* Status Badges */}
                  <div>
                    {isPending && (
                      <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                        Onay Bekliyor
                      </span>
                    )}
                    {isConfirmed && (
                      <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                        <Check className="w-3 h-3 stroke-[3]" />
                        Onaylandı
                      </span>
                    )}
                    {isCompleted && (
                      <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Tamamlandı
                      </span>
                    )}
                    {isCancelled && (
                      <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1">
                        <X className="w-3 h-3" />
                        İptal Edildi
                      </span>
                    )}
                  </div>
                </div>

                {/* Body: Service & Customer Info */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold text-black dark:text-white">
                        {appointment.customerName}
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                        {appointment.service?.name || "Genel Randevu & İnceleme"}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-base sm:text-lg font-black text-black dark:text-white block">
                        {appointment.price} ₺
                      </span>
                    </div>
                  </div>

                  {/* Customer Note if present */}
                  {appointment.customerNote && (
                    <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-black/[0.04] dark:border-white/[0.06] flex items-start gap-2 text-xs">
                      <FileText className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                      <p className="text-zinc-600 dark:text-zinc-300 font-medium leading-relaxed">
                        "{appointment.customerNote}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer: Action Buttons */}
                <div className="pt-2 border-t border-black/[0.04] dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-2">
                  {/* Left: Contact Customer Buttons */}
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${cleanPhone}`}
                      className="px-3 py-2 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold flex items-center gap-1.5 ios-press"
                      title="Müşteriyi Doğrudan Ara"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{appointment.customerPhone}</span>
                    </a>

                    {isConfirmed ? (
                      <div className="flex items-center gap-1.5">
                        <a
                          href={waCustomerConfirmUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1 ios-press"
                          title="WhatsApp ile Onay Bildirimi Gönder"
                        >
                          <MessageCircle className="w-3.5 h-3.5 fill-current" />
                          <span>Teyit İlet</span>
                        </a>

                        <a
                          href={waCustomerReminderUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-2 rounded-2xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center gap-1 ios-press"
                          title="WhatsApp ile 2 Saat Öncesi Randevu Hatırlatması Gönder"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Hatırlat</span>
                        </a>
                      </div>
                    ) : (
                      <a
                        href={waCustomerConfirmUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 ios-press"
                        title="WhatsApp ile İletişim Kur"
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-current" />
                        <span>WhatsApp</span>
                      </a>
                    )}
                  </div>

                  {/* Right: State Transitions */}
                  <div className="flex items-center gap-2">
                    {/* Onayla (Confirm) */}
                    {isPending && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(appointment.id, "confirmed")}
                        className="px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm ios-press"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Onayla</span>
                      </button>
                    )}

                    {/* Tamamlandı (Complete) */}
                    {(isConfirmed || isPending) && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(appointment.id, "completed")}
                        className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm ios-press"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Tamamlandı</span>
                      </button>
                    )}

                    {/* İptal Et (Cancel) */}
                    {!isCancelled && !isCompleted && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(appointment.id, "cancelled")}
                        className="px-3 py-2 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-950 hover:text-rose-600 text-zinc-500 text-xs font-bold flex items-center gap-1 ios-press transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>İptal Et</span>
                      </button>
                    )}

                    {/* Yeniden Onayla if cancelled */}
                    {isCancelled && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(appointment.id, "confirmed")}
                        className="px-3 py-2 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 text-xs font-bold flex items-center gap-1.5 ios-press"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Yeniden Aktifleştir</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          /* Empty State */
          <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-dashed border-black/[0.08] dark:border-white/[0.1] text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mx-auto flex items-center justify-center">
              <CalendarX2 className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-black dark:text-white">
                Bu Tarihte Randevu Bulunamadı
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium max-w-sm mx-auto">
                {formatDisplayDate(selectedDate)} için planlanmış randevu bulunmuyor.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-2">
              {selectedDate !== todayStr && (
                <button
                  type="button"
                  onClick={() => setSelectedDate(todayStr)}
                  className="px-4 py-2 rounded-full bg-brand text-white text-xs font-bold ios-press shadow-xs"
                >
                  Bugüne Dön
                </button>
              )}
              {selectedDate !== tomorrowStr && (
                <button
                  type="button"
                  onClick={() => setSelectedDate(tomorrowStr)}
                  className="px-4 py-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold ios-press"
                >
                  Yarını İncele
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 5. MÜSAİTLİK & SLOT ENGINE AYARLARI MODAL SHEET             */}
      {/* ============================================================ */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setIsSettingsOpen(false)} />

          <div className="relative w-full max-w-md bg-white dark:bg-[#1C1C1E] border-t sm:border border-black/[0.08] dark:border-white/[0.1] rounded-t-[32px] sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] z-10 animate-in slide-in-from-bottom duration-300 overflow-hidden">
            {/* Grabber */}
            <div className="w-12 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700 mx-auto mt-3 sm:hidden shrink-0" />

            {/* Header */}
            <div className="px-6 pt-4 pb-3 border-b border-black/[0.05] dark:border-white/[0.08] flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-black dark:text-white flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4 text-brand" />
                  <span>Randevu Motoru Ayarları</span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                  Müşterilerinize sunulan randevu aralıklarını belirleyin.
                </p>
              </div>

              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-1.5 rounded-full text-zinc-400 hover:text-black dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 overflow-y-auto">
              {/* Option 1: Slot Interval */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-black dark:text-white flex items-center justify-between">
                  <span>Varsayılan Randevu Aralığı</span>
                  <span className="text-brand font-black">{slotInterval} Dakika</span>
                </label>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                  Müşterinin seçebileceği saat dilimlerinin sıklığı:
                </p>
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {[15, 30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setSlotInterval(mins)}
                      className={`py-2.5 rounded-2xl text-xs font-extrabold border transition-all ios-press ${
                        slotInterval === mins
                          ? "bg-brand text-white border-brand shadow-xs ring-2 ring-brand/30"
                          : "bg-zinc-50 dark:bg-zinc-800/80 border-black/[0.04] dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      {mins} dk
                    </button>
                  ))}
                </div>
              </div>

              {/* Option 2: Buffer Time */}
              <div className="space-y-2 pt-2 border-t border-black/[0.04] dark:border-white/[0.06]">
                <label className="text-xs font-extrabold text-black dark:text-white flex items-center justify-between">
                  <span>Randevu Arası Dinlenme / Hazırlık Molası</span>
                  <span className="text-brand font-black">{bufferTime} Dakika</span>
                </label>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                  Her randevu arasına eklenecek temizlik ve bekleme payı:
                </p>
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {[0, 5, 10, 15].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setBufferTime(mins)}
                      className={`py-2.5 rounded-2xl text-xs font-extrabold border transition-all ios-press ${
                        bufferTime === mins
                          ? "bg-brand text-white border-brand shadow-xs ring-2 ring-brand/30"
                          : "bg-zinc-50 dark:bg-zinc-800/80 border-black/[0.04] dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      {mins === 0 ? "Yok" : `${mins} dk`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Option 3: Maximum Advance Booking Days */}
              <div className="space-y-2 pt-2 border-t border-black/[0.04] dark:border-white/[0.06]">
                <label className="text-xs font-extrabold text-black dark:text-white flex items-center justify-between">
                  <span>Maksimum İleri Tarih Sınırı</span>
                  <span className="text-brand font-black">{maxAdvanceDays} Gün</span>
                </label>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                  Müşteriler en fazla kaç gün sonrasına randevu alabilir:
                </p>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[7, 14, 30].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setMaxAdvanceDays(days)}
                      className={`py-2.5 rounded-2xl text-xs font-extrabold border transition-all ios-press ${
                        maxAdvanceDays === days
                          ? "bg-brand text-white border-brand shadow-xs ring-2 ring-brand/30"
                          : "bg-zinc-50 dark:bg-zinc-800/80 border-black/[0.04] dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      {days} Gün
                    </button>
                  ))}
                </div>
              </div>

              {/* Option 4: IBAN for Kapora */}
              <div className="space-y-1.5 pt-2 border-t border-black/[0.04] dark:border-white/[0.06]">
                <label className="text-xs font-extrabold text-black dark:text-white flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-brand" />
                    <span>Kapora & Havale IBAN</span>
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="TR00 0000 0000 0000 0000 0000 00"
                  value={iban}
                  onChange={(e) => setIban(e.target.value)}
                  className="w-full text-xs font-mono font-bold text-black dark:text-white bg-zinc-50 dark:bg-zinc-800/80 p-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.1] focus:outline-none focus:border-brand"
                />
              </div>

              {/* Option 5: Deposit Note */}
              <div className="space-y-1.5 pt-2 border-t border-black/[0.04] dark:border-white/[0.06]">
                <label className="text-xs font-extrabold text-black dark:text-white block">
                  Kapora Bilgilendirme Notu
                </label>
                <input
                  type="text"
                  placeholder="Örn: Açıklamaya adınızı ve randevu kodunu yazınız."
                  value={depositNote}
                  onChange={(e) => setDepositNote(e.target.value)}
                  className="w-full text-xs font-medium text-black dark:text-white bg-zinc-50 dark:bg-zinc-800/80 p-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.1] focus:outline-none focus:border-brand"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-black/[0.05] dark:border-white/[0.08] flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="flex-1 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs ios-press"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={isSavingSettings}
                onClick={handleSaveSettings}
                className="flex-1 py-3 rounded-2xl bg-brand text-white font-extrabold text-xs shadow-md disabled:opacity-50 ios-press flex items-center justify-center gap-1.5"
              >
                {isSavingSettings ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 stroke-[3]" />
                )}
                <span>Ayarları Kaydet</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
