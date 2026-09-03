export type CategoryId = 
  | "berber"
  | "kuafor"
  | "guzellik"
  | "cilingir"
  | "elektrikci"
  | "tesisat"
  | "kucuk-ev-aletleri"
  | "bisiklet-tamir"
  | "oto-tamir"
  | "oto-yikama"
  | "oto-lastik"
  | "terzi"
  | "lostra"
  | "kuru-temizleme"
  | "veteriner"
  | "pet-kuafor";

export type SubscriptionTier = "free" | "pro" | "plus";

export interface Category {
  id: CategoryId;
  name: string;
  shortName: string;
  icon: string;
  description: string;
  count: number;
  color: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  description?: string | null;
  minPrice: number;
  maxPrice?: number | null;
  isStartingPrice?: boolean;
  estimatedDuration?: string | null;
  popular?: boolean;
  requiresDeposit?: boolean;
  depositAmount?: number | null;
  appointments?: Appointment[];
}

export interface Review {
  id: string;
  author: string;
  profession?: string | null;
  rating: number;
  date: string;
  comment: string;
  tags?: string[];
  verifiedCustomer?: boolean;
}

export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface Appointment {
  id: string;
  merchantId: string;
  serviceId?: string | null;
  customerName: string;
  customerPhone: string;
  customerNote?: string | null;
  date: string; // Format: YYYY-MM-DD
  startTime: string; // Format: HH:mm, e.g., "14:30"
  endTime?: string | null; // Format: HH:mm
  price: number;
  status: AppointmentStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
  merchant?: Merchant;
  service?: ServiceItem | null;
}

export interface Merchant {
  id: string;
  slug: string;
  name: string;
  craftTitle: string;
  masterName: string;
  category: CategoryId;
  city: string; // e.g. "İstanbul", "Ankara", "İzmir", "Bursa", "Antalya"
  district: string; // e.g. "Kadıköy", "Çankaya", "Konak"
  neighborhood: string; // e.g. "Moda", "Tunalı", "Alsancak"
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  phone: string;
  whatsapp: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  verifiedYear?: number | null;
  tier: SubscriptionTier;
  experienceYears: number;
  minPrice: number;
  maxPrice: number;
  priceNote?: string | null;
  workingHours: {
    weekdays: string;
    saturday: string;
    sunday: string;
  };
  isOpenNow: boolean;
  heroImage: string;
  galleryImages: string[];
  bio: string;
  specialties: string[];
  services: ServiceItem[];
  reviews: Review[];
  appointments?: Appointment[];
  features: {
    transparentPricing: boolean;
    whatsappBooking: boolean;
    expressOption: boolean;
    homePickup?: boolean;
    slotInterval?: number; // 15, 30, 45, 60
    bufferTime?: number; // 0, 5, 10, 15
    maxAdvanceDays?: number; // 7, 14, 30
    iban?: string;
    depositNote?: string;
  };
}

export interface District {
  name: string;
  neighborhoods: string[];
}

export interface City {
  name: string;
  shortCode: string;
  districts: District[];
}
