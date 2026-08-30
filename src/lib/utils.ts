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
