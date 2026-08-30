"use client";

import { Merchant, ServiceItem } from "@/types";
import { MERCHANTS as INITIAL_MERCHANTS } from "@/data/seed-merchants";

const STORAGE_KEY = "esnafca_dynamic_merchants_v2";
const PENDING_KEY = "esnafca_pending_applications_v1";

export interface MerchantApplication {
  id: string;
  name: string;
  masterName: string;
  category: string;
  experienceYears?: number;
  city: string;
  district: string;
  neighborhood: string;
  address: string;
  phone: string;
  whatsapp: string;
  plan: string;
  services: { name: string; minPrice: string; maxPrice: string }[];
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
}

// Get all merchants (merging initial seed with local overrides)
export function getAllMerchants(): Merchant[] {
  if (typeof window === "undefined") return INITIAL_MERCHANTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MERCHANTS));
      return INITIAL_MERCHANTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_MERCHANTS;
  } catch {
    return INITIAL_MERCHANTS;
  }
}

// Get merchant by slug (checking live storage first)
export function getMerchantBySlug(slug: string): Merchant | null {
  if (!slug) return null;
  const decoded = decodeURIComponent(slug).toLowerCase().trim();
  const all = getAllMerchants();
  return (
    all.find((m) => m.slug === slug || m.slug === decoded || decodeURIComponent(m.slug).toLowerCase() === decoded) ||
    INITIAL_MERCHANTS.find((m) => m.slug === slug || m.slug === decoded || decodeURIComponent(m.slug).toLowerCase() === decoded) ||
    null
  );
}

// Find merchant by phone number
export function findMerchantByPhone(phone: string): Merchant | null {
  const clean = phone.replace(/\D/g, "");
  if (!clean) return null;
  const all = getAllMerchants();
  return (
    all.find((m) => {
      const pClean = m.phone.replace(/\D/g, "");
      const wClean = m.whatsapp.replace(/\D/g, "");
      return pClean.includes(clean) || clean.includes(pClean) || wClean.includes(clean) || clean.includes(wClean);
    }) || null
  );
}

// Save all merchants
export function saveAllMerchants(merchants: Merchant[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merchants));
  window.dispatchEvent(new Event("merchants_updated"));
}

// Update a single merchant
export function updateMerchant(id: string, updates: Partial<Merchant>): Merchant | null {
  const current = getAllMerchants();
  const index = current.findIndex((m) => m.id === id);
  if (index === -1) return null;

  const updated = { ...current[index], ...updates };
  current[index] = updated;
  saveAllMerchants(current);
  return updated;
}

// Get all pending applications
export function getPendingApplications(): MerchantApplication[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) {
      // Seed 2 mock pending applications for immediate testing
      const initialPending: MerchantApplication[] = [
        {
          id: "app-101",
          name: "Usta Ahmet Erkek Kuaförü",
          masterName: "Ahmet Usta",
          category: "berber-kuafor",
          experienceYears: 18,
          city: "İstanbul",
          district: "Beşiktaş",
          neighborhood: "Sinanpaşa (Çarşı)",
          address: "Sinanpaşa Mah. Şair Nedim Cad. No: 12/B, Beşiktaş / İstanbul",
          phone: "0532 999 88 77",
          whatsapp: "905329998877",
          plan: "pro",
          services: [
            { name: "Saç Kesimi & Yıkama", minPrice: "250", maxPrice: "350" },
            { name: "Sakal Tıraşı (Sıcak Havlu)", minPrice: "150", maxPrice: "200" },
          ],
          submittedAt: "Bugün, 14:20",
          status: "pending",
        },
        {
          id: "app-102",
          name: "Kadıköy Hızlı Lostra & Deri Bakım",
          masterName: "Kemal Usta",
          category: "terzi-lostra",
          experienceYears: 24,
          city: "İstanbul",
          district: "Kadıköy",
          neighborhood: "Moda (Caferağa)",
          address: "Caferağa Mah. Mühürdar Cad. No: 44, Kadıköy / İstanbul",
          phone: "0533 111 22 33",
          whatsapp: "905331112233",
          plan: "plus",
          services: [
            { name: "Ayakkabı Boya & Lostra", minPrice: "100", maxPrice: "180" },
            { name: "Deri Taban & Ökçe Değişimi", minPrice: "300", maxPrice: "500" },
          ],
          submittedAt: "Bugün, 11:05",
          status: "pending",
        },
      ];
      localStorage.setItem(PENDING_KEY, JSON.stringify(initialPending));
      return initialPending;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// Find pending application by phone
export function findPendingApplicationByPhone(phone: string): MerchantApplication | null {
  const clean = phone.replace(/\D/g, "");
  if (!clean) return null;
  const pending = getPendingApplications();
  return (
    pending.find((app) => {
      const pClean = app.phone.replace(/\D/g, "");
      const wClean = app.whatsapp.replace(/\D/g, "");
      return pClean.includes(clean) || clean.includes(pClean) || wClean.includes(clean) || clean.includes(wClean);
    }) || null
  );
}

// Add a new application
export function addPendingApplication(app: Omit<MerchantApplication, "id" | "submittedAt" | "status">): MerchantApplication {
  const current = getPendingApplications();
  const newApp: MerchantApplication = {
    ...app,
    id: `app-${Date.now()}`,
    submittedAt: "Şimdi",
    status: "pending",
  };
  const updated = [newApp, ...current];
  if (typeof window !== "undefined") {
    localStorage.setItem(PENDING_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("applications_updated"));
  }
  return newApp;
}

// Approve an application into live merchants
export function approveApplication(appId: string): Merchant | null {
  const pending = getPendingApplications();
  const target = pending.find((p) => p.id === appId);
  if (!target) return null;

  const currentMerchants = getAllMerchants();
  const slug = target.name
    .toLowerCase()
    .replace(/[^a-z0-9ğüşıöç]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const minPrices = target.services.map((s) => Number(s.minPrice) || 100);
  const maxPrices = target.services.map((s) => Number(s.maxPrice) || Number(s.minPrice) || 200);

  const calculatedMin = minPrices.length > 0 ? Math.min(...minPrices) : 100;
  const calculatedMax = maxPrices.length > 0 ? Math.max(...maxPrices) : 500;

  const newMerchant: Merchant = {
    id: `mer-${Date.now()}`,
    slug: `${slug}-${Math.floor(Math.random() * 1000)}`,
    name: target.name,
    craftTitle: "Mahalle Esnafı & Doğrulanmış Usta",
    masterName: target.masterName,
    category: target.category as any,
    city: target.city,
    district: target.district,
    neighborhood: target.neighborhood,
    address: target.address,
    phone: target.phone,
    whatsapp: target.whatsapp,
    rating: 5.0,
    reviewCount: 1,
    verified: true,
    verifiedYear: new Date().getFullYear(),
    tier: (target.plan as any) || "pro",
    experienceYears: target.experienceYears || 10,
    minPrice: calculatedMin,
    maxPrice: calculatedMax,
    workingHours: {
      weekdays: "09:00 - 19:30",
      saturday: "09:00 - 19:00",
      sunday: "Kapalı",
    },
    isOpenNow: true,
    heroImage: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80",
    galleryImages: ["https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80"],
    bio: `${target.neighborhood} bölgesinde hizmet veren doğrulanmış mahalle esnafımız.`,
    specialties: target.services.map((s) => s.name).slice(0, 3),
    services: target.services.map((s, idx) => ({
      id: `srv-${idx + 1}`,
      name: s.name,
      minPrice: Number(s.minPrice) || 100,
      maxPrice: Number(s.maxPrice) || Number(s.minPrice) || 200,
      popular: idx === 0,
    })),
    reviews: [
      {
        id: `rev-${Date.now()}`,
        author: "Mahalleli (İlk Yorum)",
        date: "Yeni Kayıt",
        rating: 5,
        comment: "Yeni katılan mahalle esnafımız. Şeffaf fiyat tarifesi onaylanmıştır.",
        tags: ["Yeni Esnaf", "Doğrulanmış"],
      },
    ],
    features: {
      transparentPricing: true,
      whatsappBooking: true,
      expressOption: true,
      homePickup: false,
    },
  };

  // Remove from pending
  const updatedPending = pending.filter((p) => p.id !== appId);
  localStorage.setItem(PENDING_KEY, JSON.stringify(updatedPending));

  // Add to merchants
  saveAllMerchants([newMerchant, ...currentMerchants]);
  window.dispatchEvent(new Event("applications_updated"));

  return newMerchant;
}

// Reject application
export function rejectApplication(appId: string) {
  const pending = getPendingApplications();
  const updatedPending = pending.filter((p) => p.id !== appId);
  if (typeof window !== "undefined") {
    localStorage.setItem(PENDING_KEY, JSON.stringify(updatedPending));
    window.dispatchEvent(new Event("applications_updated"));
  }
}
