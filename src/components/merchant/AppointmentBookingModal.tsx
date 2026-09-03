"use client";

import { useState, useMemo, useEffect } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  User,
  Phone,
  MessageSquare,
  CheckCircle2,
  MessageCircle,
  Sparkles,
  MapPin,
  AlertCircle,
  Scissors,
  Check,
  CreditCard,
  Loader2,
} from "lucide-react";
import { Merchant, ServiceItem } from "@/types";
import { createAppointmentAction, getAvailableSlotsAction } from "@/app/actions/appointment";

interface AppointmentBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  merchant: Merchant;
  preselectedServiceId?: string | null;
}

const TURKISH_DAYS_SHORT = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
const TURKISH_DAYS_FULL = [
  "Pazar",
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
];
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

interface AvailableDate {
  dateStr: string; // YYYY-MM-DD
  dayLabel: string; // "Bugün", "Yarın", or "Çarşamba"
  dayShort: string; // "Çar"
  dayNumber: number; // 3
  monthName: string; // "Eyl"
  hoursStr: string; // "09:00 - 19:30"
}

export function AppointmentBookingModal({
  isOpen,
  onClose,
  merchant,
  preselectedServiceId,
}: AppointmentBookingModalProps) {
  // Step state: 1: Service, 2: Date, 3: Time, 4: Customer Details
  const [step, setStep] = useState<number>(1);

  // Form selections
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [selectedDate, setSelectedDate] = useState<AvailableDate | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [customerNote, setCustomerNote] = useState<string>("");

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [bookingResult, setBookingResult] = useState<{
    appointmentId: string;
    whatsappUrl: string;
  } | null>(null);

  // Reset or initialize on open
  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
      setBookingResult(null);
      setErrorMessage(null);

      // Handle preselected service if passed
      if (preselectedServiceId && merchant.services?.length) {
        const found = merchant.services.find((s) => s.id === preselectedServiceId);
        if (found) {
          setSelectedService(found);
          setStep(2); // Jump directly to date selection
          return;
        }
      }

      if (!selectedService && merchant.services?.length) {
        setSelectedService(merchant.services[0]);
      }
      setStep(1);
    }
  }, [isOpen, preselectedServiceId, merchant.services]);

  // Parse working hours safely
  const workingHours = useMemo(() => {
    let hours: { weekdays?: string; saturday?: string; sunday?: string } = {
      weekdays: "09:00 - 19:00",
      saturday: "09:00 - 19:00",
      sunday: "Kapalı",
    };

    if (typeof merchant.workingHours === "string") {
      try {
        hours = JSON.parse(merchant.workingHours);
      } catch {
        // use default
      }
    } else if (merchant.workingHours) {
      hours = merchant.workingHours;
    }

    return hours;
  }, [merchant.workingHours]);

  // Compute available dates (Configurable advance days, default 14, skipping closed days)
  const availableDates = useMemo<AvailableDate[]>(() => {
    const list: AvailableDate[] = [];
    const now = new Date();
    const maxDays = merchant.features?.maxAdvanceDays || 14;

    for (let i = 0; i < maxDays; i++) {
      const d = new Date();
      d.setDate(now.getDate() + i);

      const dayOfWeek = d.getDay();
      let hoursStr = workingHours.weekdays || "09:00 - 19:00";
      if (dayOfWeek === 0) {
        hoursStr = workingHours.sunday || "Kapalı";
      } else if (dayOfWeek === 6) {
        hoursStr = workingHours.saturday || "09:00 - 19:00";
      }

      const isClosed =
        !hoursStr ||
        hoursStr.toLowerCase().includes("kapal") ||
        hoursStr.toLowerCase().includes("closed") ||
        hoursStr.toLowerCase().includes("tatil");

      if (isClosed) {
        continue; // Skip closed days
      }

      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;

      let dayLabel = TURKISH_DAYS_FULL[dayOfWeek];
      if (i === 0) dayLabel = "Bugün";
      else if (i === 1) dayLabel = "Yarın";

      list.push({
        dateStr,
        dayLabel,
        dayShort: TURKISH_DAYS_SHORT[dayOfWeek],
        dayNumber: d.getDate(),
        monthName: TURKISH_MONTHS[d.getMonth()].slice(0, 3),
        hoursStr,
      });
    }

    return list;
  }, [workingHours, merchant.features]);

  // Set default date when available
  useEffect(() => {
    if (availableDates.length > 0 && !selectedDate) {
      setSelectedDate(availableDates[0]);
    }
  }, [availableDates, selectedDate]);

  // Live Collision-free Time Slots from Booking Engine
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);

  useEffect(() => {
    if (!selectedDate) {
      setTimeSlots([]);
      return;
    }

    let isCancelled = false;
    setIsLoadingSlots(true);

    getAvailableSlotsAction(merchant.id, selectedService?.id, selectedDate.dateStr)
      .then((res) => {
        if (!isCancelled) {
          if (res.success && Array.isArray(res.slots)) {
            setTimeSlots(res.slots);
            if (res.slots.length > 0) {
              setSelectedTime((prev) => (res.slots.includes(prev) ? prev : res.slots[0]));
            } else {
              setSelectedTime("");
            }
          } else {
            setTimeSlots([]);
            setSelectedTime("");
          }
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setTimeSlots([]);
          setSelectedTime("");
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoadingSlots(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [merchant.id, selectedDate, selectedService]);

  // Handle Form Submission
  const handleSubmitBooking = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    if (!selectedDate) {
      setErrorMessage("Lütfen geçerli bir randevu tarihi seçin.");
      setStep(2);
      return;
    }

    if (!selectedTime) {
      setErrorMessage("Lütfen geçerli bir randevu saati seçin.");
      setStep(3);
      return;
    }

    if (!customerName.trim() || customerName.trim().length < 2) {
      setErrorMessage("Lütfen ad ve soyadınızı eksiksiz girin.");
      return;
    }

    const cleanPhone = customerPhone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setErrorMessage("Lütfen geçerli ve en az 10 haneli bir telefon numarası girin.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await createAppointmentAction({
        merchantId: merchant.id,
        serviceId: selectedService?.id || null,
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        customerNote: customerNote.trim() || null,
        date: selectedDate.dateStr,
        startTime: selectedTime,
        price: selectedService?.minPrice ?? merchant.minPrice,
      });

      if (res.success && res.appointmentId && res.whatsappUrl) {
        setBookingResult({
          appointmentId: res.appointmentId,
          whatsappUrl: res.whatsappUrl,
        });
        setIsSuccess(true);
      } else {
        setErrorMessage(res.error || "Randevu oluşturulamadı. Lütfen tekrar deneyin.");
      }
    } catch {
      setErrorMessage("Bağlantı hatası oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* iOS Modal Sheet */}
      <div className="relative w-full max-w-lg bg-white dark:bg-[#1C1C1E] border-t sm:border border-black/[0.08] dark:border-white/[0.1] rounded-t-[32px] sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] z-10 animate-in slide-in-from-bottom duration-300 overflow-hidden">
        {/* iOS Grabber */}
        <div className="w-12 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700 mx-auto mt-3 sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="px-5 pt-3 pb-3 border-b border-black/[0.05] dark:border-white/[0.08] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {step > 1 && !isSuccess ? (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="p-1.5 -ml-1.5 rounded-full hover:bg-black/[0.04] dark:hover:bg-white/[0.08] text-zinc-600 dark:text-zinc-300 ios-press"
                title="Geri"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            ) : null}

            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-black dark:text-white flex items-center gap-1.5">
                <span>Online Randevu</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand/10 text-brand">
                  Esnafça
                </span>
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                {merchant.name} · {merchant.masterName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-zinc-400 dark:text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 ios-press"
            title="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Step Bar (When not in success state) */}
        {!isSuccess && (
          <div className="px-5 pt-3 pb-1 border-b border-black/[0.03] dark:border-white/[0.04] bg-zinc-50/70 dark:bg-zinc-900/40 shrink-0">
            <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 dark:text-zinc-400 mb-2">
              <span className={step === 1 ? "text-brand font-extrabold" : ""}>1. Hizmet</span>
              <ChevronRight className="w-3 h-3 text-zinc-300 dark:text-zinc-600" />
              <span className={step === 2 ? "text-brand font-extrabold" : ""}>2. Gün</span>
              <ChevronRight className="w-3 h-3 text-zinc-300 dark:text-zinc-600" />
              <span className={step === 3 ? "text-brand font-extrabold" : ""}>3. Saat</span>
              <ChevronRight className="w-3 h-3 text-zinc-300 dark:text-zinc-600" />
              <span className={step === 4 ? "text-brand font-extrabold" : ""}>4. Bilgiler</span>
            </div>

            {/* Segmented Progress Track */}
            <div className="grid grid-cols-4 gap-1.5 pb-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i <= step
                      ? "bg-brand"
                      : "bg-zinc-200 dark:bg-zinc-800"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span className="font-semibold">{errorMessage}</span>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 1: SELECT SERVICE */}
          {/* ============================================================ */}
          {step === 1 && !isSuccess && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="space-y-0.5">
                <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  1. Almak İstediğiniz Hizmeti Seçin
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                  Ustanın şeffaf fiyat menüsünden işlem tercihinizi yapın.
                </p>
              </div>

              <div className="space-y-2 pt-1">
                {merchant.services && merchant.services.length > 0 ? (
                  merchant.services.map((service) => {
                    const isSelected = selectedService?.id === service.id;
                    return (
                      <div
                        key={service.id}
                        onClick={() => setSelectedService(service)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ios-press ${
                          isSelected
                            ? "bg-brand/5 dark:bg-brand/10 border-brand text-black dark:text-white shadow-sm ring-1 ring-brand/40"
                            : "bg-zinc-50 dark:bg-zinc-900/60 border-black/[0.04] dark:border-white/[0.06] hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60"
                        }`}
                      >
                        <div className="space-y-1 flex-1 pr-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-xs sm:text-sm text-black dark:text-white">
                              {service.name}
                            </span>
                            {service.popular && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-1.5 py-0.2 rounded-full">
                                <Sparkles className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" /> Popüler
                              </span>
                            )}
                            {service.requiresDeposit && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-1.5 py-0.5 rounded-full">
                                <CreditCard className="w-2.5 h-2.5" />
                                <span>{service.depositAmount || 100} ₺ Kapora</span>
                              </span>
                            )}
                          </div>

                          {service.description && (
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug line-clamp-1 font-medium">
                              {service.description}
                            </p>
                          )}

                          {service.estimatedDuration && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold">
                              <Clock className="w-3 h-3" />
                              <span>{service.estimatedDuration}</span>
                            </span>
                          )}
                        </div>

                        {/* Price & Radio Check */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <span className="font-extrabold text-xs sm:text-sm text-black dark:text-white block tracking-tight">
                              {service.minPrice} ₺
                              {service.maxPrice && service.maxPrice !== service.minPrice
                                ? ` - ${service.maxPrice} ₺`
                                : ""}
                            </span>
                            {service.isStartingPrice && (
                              <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-medium">
                                Başlangıç
                              </span>
                            )}
                          </div>

                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                              isSelected
                                ? "bg-brand border-brand text-white"
                                : "border-zinc-300 dark:border-zinc-600 bg-transparent"
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div
                    onClick={() => setSelectedService(null)}
                    className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-brand/40 text-left cursor-pointer"
                  >
                    <span className="font-extrabold text-xs text-black dark:text-white block">
                      Genel Randevu & Ön Tespit
                    </span>
                    <span className="text-[11px] text-zinc-500 font-medium block">
                      Fiyat dükkanda usta tarafından belirlenecektir.
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 2: SELECT DATE */}
          {/* ============================================================ */}
          {step === 2 && !isSuccess && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="space-y-0.5">
                <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-brand" />
                  <span>2. Randevu Gününü Seçin</span>
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                  Önümüzdeki 14 günlük açık mesai günleri listelenmektedir.
                </p>
              </div>

              {availableDates.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                  {availableDates.map((item) => {
                    const isSelected = selectedDate?.dateStr === item.dateStr;
                    return (
                      <button
                        type="button"
                        key={item.dateStr}
                        onClick={() => setSelectedDate(item)}
                        className={`p-3 rounded-2xl border text-left transition-all ios-press flex flex-col justify-between ${
                          isSelected
                            ? "bg-brand text-white border-brand shadow-md ring-2 ring-brand/30"
                            : "bg-zinc-50 dark:bg-zinc-900/60 border-black/[0.04] dark:border-white/[0.06] hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 text-black dark:text-white"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span
                            className={`text-[10px] font-extrabold uppercase tracking-wider ${
                              isSelected ? "text-white/80" : "text-brand"
                            }`}
                          >
                            {item.dayLabel}
                          </span>
                          <span
                            className={`text-[10px] font-semibold ${
                              isSelected ? "text-white/80" : "text-zinc-400"
                            }`}
                          >
                            {item.dayShort}
                          </span>
                        </div>

                        <div className="my-1.5">
                          <span className="text-xl sm:text-2xl font-black block tracking-tight">
                            {item.dayNumber}{" "}
                            <span className="text-xs font-bold uppercase">{item.monthName}</span>
                          </span>
                        </div>

                        <span
                          className={`text-[10px] font-medium block truncate ${
                            isSelected ? "text-white/90" : "text-zinc-400 dark:text-zinc-500"
                          }`}
                        >
                          {item.hoursStr}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-center text-xs text-zinc-500">
                  Ustanın uygun randevu günü bulunamadı.
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 3: SELECT TIME SLOT */}
          {/* ============================================================ */}
          {step === 3 && !isSuccess && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="space-y-0.5">
                <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-brand" />
                  <span>3. Randevu Saatini Seçin</span>
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                  {selectedDate?.dayLabel} ({selectedDate?.dayNumber} {selectedDate?.monthName}) için uygun saat aralıkları:
                </p>
              </div>

              {isLoadingSlots ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div
                      key={i}
                      className="h-11 rounded-2xl bg-zinc-100 dark:bg-zinc-800 animate-pulse"
                    />
                  ))}
                </div>
              ) : timeSlots.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                  {timeSlots.map((slot) => {
                    const isSelected = selectedTime === slot;
                    return (
                      <button
                        type="button"
                        key={slot}
                        onClick={() => setSelectedTime(slot)}
                        className={`py-3 px-2.5 rounded-2xl border text-center font-extrabold text-xs sm:text-sm transition-all ios-press ${
                          isSelected
                            ? "bg-brand text-white border-brand shadow-sm ring-2 ring-brand/30"
                            : "bg-zinc-50 dark:bg-zinc-900/60 border-black/[0.04] dark:border-white/[0.06] hover:bg-zinc-100 dark:hover:bg-zinc-800 text-black dark:text-white"
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-black/[0.04] dark:border-white/[0.06] text-center space-y-2">
                  <Clock className="w-6 h-6 text-zinc-400 mx-auto" />
                  <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                    Seçtiğiniz tarihte uygun boş saat dilimi kalmamıştır.
                  </p>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-4 py-1.5 rounded-full bg-brand/10 text-brand text-xs font-bold"
                  >
                    Başka Bir Gün Seç
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 4: CUSTOMER DETAILS */}
          {/* ============================================================ */}
          {step === 4 && !isSuccess && (
            <form onSubmit={handleSubmitBooking} className="space-y-4 animate-in fade-in duration-200">
              <div className="space-y-0.5">
                <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  4. İletişim & Randevu Detayları
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                  Ustanın teyit edebilmesi için iletişim bilgilerinizi girin.
                </p>
              </div>

              {/* Booking Summary Box */}
              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-black/[0.04] dark:border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-medium">İşlem:</span>
                  <span className="font-extrabold text-black dark:text-white">
                    {selectedService?.name || "Genel Randevu"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-medium">Tarih & Saat:</span>
                  <span className="font-extrabold text-black dark:text-white">
                    {selectedDate?.dayNumber} {selectedDate?.monthName} ({selectedDate?.dayLabel}) · {selectedTime}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-black/[0.04] dark:border-white/[0.06]">
                  <span className="text-zinc-400 font-medium">Tahmini Ücret:</span>
                  <span className="font-black text-brand text-sm">
                    {selectedService?.minPrice ?? merchant.minPrice} ₺
                  </span>
                </div>
              </div>

              {/* Optional Deposit / Kapora Notice */}
              {selectedService?.requiresDeposit && (
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-1.5 font-extrabold text-xs">
                    <CreditCard className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Kapora / Ön Ödeme Bilgilendirmesi</span>
                  </div>
                  <p className="text-[11px] leading-relaxed font-medium">
                    Bu hizmet için <strong>{selectedService.depositAmount || 100} ₺</strong> kapora talep edilmektedir. Randevunuz esnaf tarafından teyit edildikten sonra kesinleşecektir.
                  </p>
                  {merchant.features?.iban && (
                    <div className="pt-1.5 border-t border-amber-200/60 dark:border-amber-800/40 text-[11px]">
                      <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 block">Esnaf IBAN:</span>
                      <span className="font-mono font-bold select-all text-xs text-black dark:text-white bg-amber-100/60 dark:bg-amber-900/40 px-2 py-1 rounded-md block mt-0.5">
                        {merchant.features.iban}
                      </span>
                    </div>
                  )}
                  {merchant.features?.depositNote && (
                    <p className="text-[10px] italic text-amber-800/80 dark:text-amber-300/80 pt-0.5">
                      * {merchant.features.depositNote}
                    </p>
                  )}
                </div>
              )}

              {/* Name Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                  <User className="w-3.5 h-3.5" /> Adınız & Soyadınız *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Ahmet Yılmaz"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full text-xs font-semibold text-black dark:text-white bg-zinc-100 dark:bg-zinc-800 p-3 rounded-2xl border border-transparent focus:border-brand focus:outline-none"
                />
              </div>

              {/* Phone Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> Telefon Numaranız *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="05XX XXX XX XX"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full text-xs font-semibold text-black dark:text-white bg-zinc-100 dark:bg-zinc-800 p-3 rounded-2xl border border-transparent focus:border-brand focus:outline-none"
                />
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block">
                  Randevu teyidi ve WhatsApp bildirimi için kullanılacaktır.
                </span>
              </div>

              {/* Note Textarea */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" /> Not / Talep (İsteğe Bağlı)
                </label>
                <textarea
                  rows={2}
                  placeholder="Örn: Aracın freninden ses geliyor / Saat 14:00 öncesi gelemem."
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  className="w-full text-xs font-medium text-black dark:text-white bg-zinc-100 dark:bg-zinc-800 p-3 rounded-2xl border border-transparent focus:border-brand focus:outline-none resize-none"
                />
              </div>
            </form>
          )}

          {/* ============================================================ */}
          {/* SUCCESS SCREEN */}
          {/* ============================================================ */}
          {isSuccess && bookingResult && (
            <div className="py-4 px-1 text-center space-y-5 animate-in zoom-in-95 duration-250">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-md">
                <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-extrabold text-black dark:text-white">
                  Randevu Talebiniz Alındı!
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium max-w-sm mx-auto">
                  Talebiniz kaydedildi. Aşağıdaki butona dokunarak doğrudan ustaya WhatsApp üzerinden anında teyit mesajı iletebilirsiniz.
                </p>
              </div>

              {/* Confirmed Details Card */}
              <div className="p-4 rounded-3xl bg-zinc-50 dark:bg-zinc-900/60 border border-black/[0.04] dark:border-white/[0.06] text-left space-y-2.5">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-black/[0.04] dark:border-white/[0.06]">
                  <span className="text-zinc-400 font-medium">Randevu Kodu:</span>
                  <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">
                    #{bookingResult.appointmentId.slice(-6).toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-medium">Esnaf:</span>
                  <span className="font-extrabold text-black dark:text-white">
                    {merchant.name} ({merchant.masterName})
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-medium">Hizmet:</span>
                  <span className="font-extrabold text-black dark:text-white">
                    {selectedService?.name || "Genel Randevu"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-medium">Zaman:</span>
                  <span className="font-extrabold text-black dark:text-white">
                    {selectedDate?.dayNumber} {selectedDate?.monthName} ({selectedDate?.dayLabel}) · {selectedTime}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-medium">Tutar:</span>
                  <span className="font-black text-brand text-sm">
                    {selectedService?.minPrice ?? merchant.minPrice} ₺
                  </span>
                </div>

                <div className="pt-2 border-t border-black/[0.04] dark:border-white/[0.06] flex items-start gap-1.5 text-[11px] text-zinc-500">
                  <MapPin className="w-3.5 h-3.5 text-brand shrink-0 mt-0.5" />
                  <span>{merchant.address}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <a
                  href={bookingResult.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full p-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg ios-press transition-all"
                >
                  <MessageCircle className="w-4 h-4 fill-white/20" />
                  <span>WhatsApp ile Ustaya Bildir & Onayla</span>
                </a>

                {selectedService?.requiresDeposit && (
                  <p className="text-[11px] text-center text-amber-700 dark:text-amber-300 font-medium px-2">
                    ℹ️ Kapora ödemesini esnaf ile WhatsApp görüşmenizde teyit ettikten sonra gerçekleştirebilirsiniz.
                  </p>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs hover:bg-zinc-200 dark:hover:bg-zinc-700 ios-press"
                >
                  Kapat
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Fixed Navigation (Steps 1 to 4) */}
        {!isSuccess && (
          <div className="px-5 py-3.5 border-t border-black/[0.05] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] flex items-center justify-between gap-3 shrink-0">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="px-5 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs ios-press"
              >
                Geri
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-bold text-xs ios-press"
              >
                Vazgeç
              </button>
            )}

            {step < 4 ? (
              <button
                type="button"
                disabled={
                  (step === 1 && !selectedService && merchant.services?.length > 0) ||
                  (step === 2 && !selectedDate) ||
                  (step === 3 && !selectedTime)
                }
                onClick={() => {
                  setErrorMessage(null);
                  setStep((s) => s + 1);
                }}
                className="flex-1 py-3.5 rounded-2xl bg-brand text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50 disabled:cursor-not-allowed ios-press"
              >
                <span>Devam Et</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting || !customerName.trim() || !customerPhone.trim()}
                onClick={() => handleSubmitBooking()}
                className="flex-1 py-3.5 rounded-2xl bg-brand text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed ios-press"
              >
                {isSubmitting ? (
                  <span>Oluşturuluyor...</span>
                ) : (
                  <>
                    <Calendar className="w-4 h-4" />
                    <span>Randevuyu Oluştur</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
