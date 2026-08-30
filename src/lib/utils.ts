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
