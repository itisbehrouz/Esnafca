import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(val: number): string {
  if (val === 0) return "0";
  return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function formatPrice(price: number): string {
  return `${formatNumber(price)} ₺`;
}

/**
 * Formats and restricts Turkish phone numbers to standard 11 digits: 05XX XXX XX XX
 */
export function formatPhoneNumber(val: string): string {
  const raw = val.replace(/\D/g, "");
  if (!raw) return "";

  let digits = raw;
  if (digits.startsWith("90") && digits.length > 2) {
    digits = digits.slice(2);
  }
  if (!digits.startsWith("0") && digits.length > 0) {
    digits = "0" + digits;
  }
  digits = digits.slice(0, 11);

  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  if (digits.length <= 9) return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9, 11)}`;
}

/**
 * Safely parses a JSON field that may be either a string or native JSON object (PostgreSQL / SQLite)
 */
export function parseJsonField<T = any>(field: unknown, fallback: T): T {
  if (field === null || field === undefined) return fallback;
  if (typeof field === "string") {
    try {
      return JSON.parse(field) as T;
    } catch {
      return fallback;
    }
  }
  return field as T;
}

/**
 * Normalizes any Turkish phone number format (05xx, +905xx, 905xx, 00905xx, 5xx) to standard 10 digits
 */
export function normalizeToTenDigits(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0090")) digits = digits.slice(4);
  if (digits.startsWith("90") && digits.length === 12) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);
  if (digits.length === 10) return digits;
  return null;
}

