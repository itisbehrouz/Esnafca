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
  description?: string;
  minPrice: number;
  maxPrice?: number;
  isStartingPrice?: boolean;
  estimatedDuration?: string;
  popular?: boolean;
}

export interface Review {
  id: string;
  author: string;
  profession?: string;
  rating: number;
  date: string;
  comment: string;
  tags?: string[];
  verifiedCustomer?: boolean;
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
  verifiedYear?: number;
  tier: SubscriptionTier;
  experienceYears: number;
  minPrice: number;
  maxPrice: number;
  priceNote?: string;
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
  features: {
    transparentPricing: boolean;
    whatsappBooking: boolean;
    expressOption: boolean;
    homePickup?: boolean;
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
