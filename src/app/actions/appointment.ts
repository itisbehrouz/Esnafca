"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { AppointmentStatus } from "@/types";
import { isSlotAvailable, parseDurationMinutes, getAvailableSlots } from "@/lib/booking-engine";
import { getNewBookingMerchantAlert } from "@/lib/whatsapp-templates";

export interface CreateAppointmentInput {
  merchantId: string;
  serviceId?: string | null;
  customerName: string;
  customerPhone: string;
  customerNote?: string | null;
  date: string; // Format: YYYY-MM-DD
  startTime: string; // Format: HH:mm
  endTime?: string | null; // Format: HH:mm
  price?: number;
}

export interface ActionResult<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
  appointmentId?: string;
  whatsappUrl?: string;
}

/**
 * Helper to calculate end time based on start time and estimated duration string.
 */
function calculateEndTime(startTime: string, durationStr?: string | null): string | null {
  if (!startTime || !startTime.includes(":")) return null;
  const [hStr, mStr] = startTime.split(":");
  const startHour = parseInt(hStr, 10);
  const startMin = parseInt(mStr, 10);
  if (isNaN(startHour) || isNaN(startMin)) return null;

  const durationMinutes = parseDurationMinutes(durationStr);

  const totalMinutes = startHour * 60 + startMin + durationMinutes;
  const endHour = Math.floor(totalMinutes / 60) % 24;
  const endMin = totalMinutes % 60;

  return `${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}`;
}

/**
 * 1. Create Appointment Action
 * Validates inputs, saves to SQLite via Prisma, and returns prefilled WhatsApp URL.
 */
export async function createAppointmentAction(
  data: CreateAppointmentInput
): Promise<ActionResult<{ appointmentId: string; whatsappUrl: string }>> {
  try {
    // 1. Validate Merchant
    if (!data.merchantId) {
      return { success: false, error: "Esnaf bilgisi eksik." };
    }

    const merchant = await prisma.merchant.findUnique({
      where: { id: data.merchantId },
      include: { services: true },
    });

    if (!merchant) {
      return { success: false, error: "Belirtilen esnaf veritabanında bulunamadı." };
    }

    // 2. Validate Customer Name
    const customerName = data.customerName?.trim();
    if (!customerName || customerName.length < 2) {
      return { success: false, error: "Lütfen geçerli bir ad ve soyad girin." };
    }

    // 3. Validate Phone Number (must be minimum 10 digits)
    const cleanPhone = (data.customerPhone || "").replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      return { success: false, error: "Lütfen en az 10 haneli geçerli bir telefon numarası girin." };
    }

    // 4. Validate Date (Format: YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!data.date || !dateRegex.test(data.date)) {
      return { success: false, error: "Geçersiz randevu tarihi (YYYY-MM-DD formatında olmalıdır)." };
    }

    // 5. Validate Time (Format: HH:mm)
    const timeRegex = /^\d{1,2}:\d{2}$/;
    if (!data.startTime || !timeRegex.test(data.startTime)) {
      return { success: false, error: "Geçersiz randevu saati (HH:mm formatında olmalıdır)." };
    }

    // 6. Resolve Service & Price
    let selectedService = null;
    let finalPrice = Number(data.price) || merchant.minPrice || 0;

    if (data.serviceId) {
      selectedService = merchant.services.find((s) => s.id === data.serviceId);
      if (selectedService) {
        finalPrice = Number(data.price) || selectedService.minPrice;
      }
    }

    // 6.5. Race-Condition Prevention: Check slot collision before inserting!
    const durationMinutes = parseDurationMinutes(selectedService?.estimatedDuration);
    const isFree = await isSlotAvailable(merchant.id, data.date, data.startTime, durationMinutes);
    if (!isFree) {
      return {
        success: false,
        error: "Seçtiğiniz randevu saati az önce başka bir müşteri tarafından rezerve edildi. Lütfen başka bir saat seçin.",
      };
    }

    // 7. Calculate End Time
    const endTime =
      data.endTime ||
      calculateEndTime(data.startTime, selectedService?.estimatedDuration);

    // 8. Create Appointment in DB
    const appointment = await prisma.appointment.create({
      data: {
        merchantId: merchant.id,
        serviceId: selectedService?.id || null,
        customerName,
        customerPhone: cleanPhone,
        customerNote: data.customerNote?.trim() || null,
        date: data.date,
        startTime: data.startTime,
        endTime: endTime || null,
        price: finalPrice,
        status: "pending",
      },
    });

    // 9. Generate WhatsApp Link using WhatsApp template generator
    const whatsappUrl = getNewBookingMerchantAlert(
      merchant.whatsapp || merchant.phone,
      {
        ...appointment,
        service: selectedService ? { name: selectedService.name } : null,
        merchant: { name: merchant.name, masterName: merchant.masterName },
      }
    );

    try {
      revalidatePath(`/esnaf/${merchant.slug}`);
      revalidatePath(`/dukkanim`);
    } catch {
      // Ignore if called outside Next.js request context
    }

    return {
      success: true,
      appointmentId: appointment.id,
      whatsappUrl,
      data: {
        appointmentId: appointment.id,
        whatsappUrl,
      },
    };
  } catch (error) {
    console.error("Error creating appointment:", error);
    return { success: false, error: "Randevu kaydı sırasında bir hata oluştu." };
  }
}

/**
 * 2. Get Merchant Appointments Action
 * Return appointments for a merchant, optionally filtered by date, ordered by date and startTime.
 */
export async function getMerchantAppointmentsAction(
  merchantId: string,
  date?: string
) {
  try {
    if (!merchantId) {
      return { success: false, error: "Esnaf kimliği gereklidir.", appointments: [] };
    }

    const whereClause: { merchantId: string; date?: string } = { merchantId };
    if (date) {
      whereClause.date = date;
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        service: true,
      },
      orderBy: [
        { date: "asc" },
        { startTime: "asc" },
      ],
    });

    return {
      success: true,
      appointments,
    };
  } catch (error) {
    console.error("Error fetching merchant appointments:", error);
    return { success: false, error: "Randevular yüklenemedi.", appointments: [] };
  }
}

/**
 * 3. Update Appointment Status Action
 * Update status to pending, confirmed, completed, or cancelled.
 */
export async function updateAppointmentStatusAction(
  appointmentId: string,
  status: AppointmentStatus
) {
  try {
    const validStatuses: AppointmentStatus[] = ["pending", "confirmed", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return { success: false, error: "Geçersiz randevu durumu." };
    }

    if (!appointmentId) {
      return { success: false, error: "Randevu kimliği gereklidir." };
    }

    const existing = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { merchant: true },
    });

    if (!existing) {
      return { success: false, error: "Randevu bulunamadı." };
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status },
    });

    try {
      if (existing.merchant?.slug) {
        revalidatePath(`/esnaf/${existing.merchant.slug}`);
      }
      revalidatePath("/dukkanim");
    } catch {
      // Ignore if called outside Next.js request context
    }

    return {
      success: true,
      appointment: updated,
    };
  } catch (error) {
    console.error("Error updating appointment status:", error);
    return { success: false, error: "Randevu durumu güncellenemedi." };
  }
}

/**
 * 4. Get Available Slots Action (Server Action for client components)
 * Computes live collision-free time slots based on working hours and active bookings.
 */
export async function getAvailableSlotsAction(
  merchantId: string,
  serviceId?: string | null,
  date?: string
): Promise<{ success: boolean; slots: string[]; error?: string }> {
  try {
    if (!merchantId || !date) {
      return { success: false, slots: [], error: "Eksik parametre." };
    }
    const slots = await getAvailableSlots(merchantId, serviceId, date);
    return { success: true, slots };
  } catch (error) {
    console.error("Error fetching available slots:", error);
    return { success: false, slots: [], error: "Uygun saatler yüklenemedi." };
  }
}
