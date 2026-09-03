import { prisma } from "@/lib/db";

/**
 * Converts a time string "HH:mm" to total minutes from midnight.
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr || !timeStr.includes(":")) return 0;
  const [h, m] = timeStr.split(":").map((v) => parseInt(v, 10));
  if (isNaN(h) || isNaN(m)) return 0;
  return h * 60 + m;
}

/**
 * Converts total minutes from midnight to "HH:mm".
 */
export function minutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Parses duration string (e.g. "45 Dakika", "1 Saat", "1 Saat 30 Dk", "30 dk") into minutes.
 * Default fallback is 30 minutes.
 */
export function parseDurationMinutes(durationStr?: string | null): number {
  if (!durationStr) return 30;
  const lower = durationStr.toLowerCase().trim();

  let total = 0;
  if (lower.includes("saat")) {
    const hoursMatch = lower.match(/(\d+)\s*saat/);
    const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 1;
    total += hours * 60;

    const minMatch = lower.match(/(\d+)\s*(?:dakika|dk)/);
    if (minMatch) {
      total += parseInt(minMatch[1], 10);
    }
    return total > 0 ? total : 60;
  }

  const minMatch = lower.match(/(\d+)/);
  if (minMatch) {
    return parseInt(minMatch[1], 10);
  }

  return 30;
}

/**
 * Extracts working hours for a given date from merchant workingHours field.
 */
export function getMerchantWorkingHoursForDate(
  workingHoursData: any,
  dateStr: string
): { isClosed: boolean; startMinutes: number; endMinutes: number } {
  let hoursObj: Record<string, string> = {
    weekdays: "09:00 - 19:00",
    saturday: "09:00 - 19:00",
    sunday: "Kapalı",
  };

  if (typeof workingHoursData === "string") {
    try {
      hoursObj = JSON.parse(workingHoursData);
    } catch {
      // fallback
    }
  } else if (workingHoursData) {
    hoursObj = workingHoursData;
  }

  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

  let dayHoursStr = hoursObj.weekdays || "09:00 - 19:00";
  if (dayOfWeek === 0) {
    dayHoursStr = hoursObj.sunday || "Kapalı";
  } else if (dayOfWeek === 6) {
    dayHoursStr = hoursObj.saturday || "09:00 - 19:00";
  }

  const lower = dayHoursStr.toLowerCase();
  if (
    !dayHoursStr ||
    lower.includes("kapal") ||
    lower.includes("closed") ||
    lower.includes("tatil")
  ) {
    return { isClosed: true, startMinutes: 0, endMinutes: 0 };
  }

  if (lower.includes("24 saat")) {
    return { isClosed: false, startMinutes: 9 * 60, endMinutes: 21 * 60 };
  }

  const match = dayHoursStr.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  if (match) {
    const startH = parseInt(match[1], 10);
    const startM = parseInt(match[2], 10);
    const endH = parseInt(match[3], 10);
    const endM = parseInt(match[4], 10);
    return {
      isClosed: false,
      startMinutes: startH * 60 + startM,
      endMinutes: endH * 60 + endM,
    };
  }

  // Default fallback 09:00 - 19:00
  return { isClosed: false, startMinutes: 9 * 60, endMinutes: 19 * 60 };
}

/**
 * Determines if two time windows [startA, endA) and [startB, endB) collide.
 */
export function checkIntervalOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number
): boolean {
  return startA < endB && startB < endA;
}

/**
 * 1. Slot Availability & Collision Engine
 * Calculates collision-free time slots based on merchant working hours,
 * service duration, and existing pending/confirmed appointments.
 */
export async function getAvailableSlots(
  merchantId: string,
  serviceId?: string | null,
  date?: string
): Promise<string[]> {
  if (!merchantId || !date) return [];

  // 1. Fetch merchant and services
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    include: { services: true },
  });

  if (!merchant) return [];

  // 2. Parse working hours for the day
  const { isClosed, startMinutes, endMinutes } = getMerchantWorkingHoursForDate(
    merchant.workingHours,
    date
  );

  if (isClosed || startMinutes >= endMinutes) {
    return [];
  }

  // 3. Determine service duration & engine slot interval
  let durationMinutes = 30;
  if (serviceId) {
    const service = merchant.services.find((s) => s.id === serviceId);
    if (service) {
      durationMinutes = parseDurationMinutes(service.estimatedDuration);
    }
  }

  let features: any = {};
  if (typeof merchant.features === "string") {
    try {
      features = JSON.parse(merchant.features);
    } catch {}
  } else if (merchant.features) {
    features = merchant.features;
  }

  const slotInterval = features.slotInterval || 30;
  const bufferTime = features.bufferTime || 0;

  // 4. Query existing active appointments for that merchant & date
  const activeAppointments = await prisma.appointment.findMany({
    where: {
      merchantId,
      date,
      status: { in: ["pending", "confirmed"] },
    },
    select: {
      startTime: true,
      endTime: true,
    },
  });

  // Convert existing appointments into minute intervals [start, end)
  const bookedIntervals = activeAppointments.map((app) => {
    const start = timeToMinutes(app.startTime);
    let end = app.endTime ? timeToMinutes(app.endTime) : start + 30;
    // Add buffer time after the appointment if configured
    end += bufferTime;
    return { start, end };
  });

  // 5. Determine today & past time threshold
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const todayStr = `${yyyy}-${mm}-${dd}`;
  const isToday = date === todayStr;
  const currentMinutesThreshold = now.getHours() * 60 + now.getMinutes() + 15; // 15-minute advance buffer

  // 6. Generate candidate slots and filter out collisions
  const availableSlots: string[] = [];
  let candidateStart = startMinutes;

  while (candidateStart + durationMinutes <= endMinutes) {
    const candidateEnd = candidateStart + durationMinutes;

    // Check if slot has already passed for today
    if (isToday && candidateStart < currentMinutesThreshold) {
      candidateStart += slotInterval;
      continue;
    }

    // Check collision against booked intervals
    const hasCollision = bookedIntervals.some((b) =>
      checkIntervalOverlap(candidateStart, candidateEnd, b.start, b.end)
    );

    if (!hasCollision) {
      availableSlots.push(minutesToTime(candidateStart));
    }

    candidateStart += slotInterval;
  }

  return availableSlots;
}

/**
 * 2. Slot Validation for Double-Booking Race Condition Prevention.
 * Checks if a specific requested time slot is still free before booking.
 */
export async function isSlotAvailable(
  merchantId: string,
  date: string,
  startTime: string,
  durationMinutes: number = 30,
  client: any = prisma
): Promise<boolean> {
  const reqStart = timeToMinutes(startTime);
  const reqEnd = reqStart + durationMinutes;

  const allActive = await client.appointment.findMany({
    where: {
      merchantId,
      date,
      status: { in: ["pending", "confirmed"] },
    },
    select: {
      startTime: true,
      endTime: true,
    },
  });

  for (const app of allActive) {
    const appStart = timeToMinutes(app.startTime);
    const appEnd = app.endTime ? timeToMinutes(app.endTime) : appStart + 30;
    if (checkIntervalOverlap(reqStart, reqEnd, appStart, appEnd)) {
      return false; // Collision found!
    }
  }

  return true;
}
