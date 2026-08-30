"use client";

const FAVORITES_KEY = "esnafca_user_favorites";

export function getFavoriteIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleFavoriteId(id: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const current = getFavoriteIds();
    const updated = current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id];
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("favorites_updated"));
    return updated;
  } catch {
    return [];
  }
}

export function isFavoriteId(id: string): boolean {
  return getFavoriteIds().includes(id);
}
