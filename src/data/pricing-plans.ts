export type SubscriptionTierId = "free" | "pro" | "plus";

export interface PricingPlan {
  id: SubscriptionTierId;
  name: string;
  badgeTitle: string;
  badgeType: "none" | "blue" | "gold";
  monthlyPrice: number;
  annualPrice: number;
  monthlyEquivalent: number;
  tagline: string;
  popular?: boolean;
  features: {
    listing: string;
    services: string;
    whatsapp: string;
    badge: string;
    physicalKit: string;
    commission: string;
    support: string;
  };
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Mahalleli",
    badgeTitle: "Standart",
    badgeType: "none",
    monthlyPrice: 0,
    annualPrice: 0,
    monthlyEquivalent: 0,
    tagline: "Küçük esnafın dijitalde yer alması için tamamen ücretsiz.",
    features: {
      listing: "Standart Arama & Dizin Listelemesi",
      services: "5 Temel Hizmet & Fiyat Girişi",
      whatsapp: "Doğrudan Müşteri WhatsApp Linki",
      badge: "Standart Profil",
      physicalKit: "Dijital Profil & QR Paylaşımı",
      commission: "%0 Komisyon (Sıfır Kesinti)",
      support: "Topluluk & Standart Destek",
    },
  },
  {
    id: "pro",
    name: "Esnafça Pro",
    badgeTitle: "Doğrulanmış Esnaf",
    badgeType: "blue",
    monthlyPrice: 390,
    annualPrice: 3480,
    monthlyEquivalent: 290,
    popular: true,
    tagline: "Mahallede güven kazanın, öncelikli sıralanın ve dükkanınıza şık pleksi QR standı koyun.",
    features: {
      listing: "Kategoride ve Mahallede Öncelikli Sıralama",
      services: "Sınırsız Hizmet & Canlı Fiyat Menüsü",
      whatsapp: "Doğrudan WhatsApp Hattı + Hızlı Yanıt",
      badge: "Doğrulanmış Esnaf (Mavi Rozet)",
      physicalKit: "Adrese Ücretsiz Pleksi QR Standı + Cam Çıkartması",
      commission: "%0 Komisyon Garantisi",
      support: "Öncelikli WhatsApp Destek Hattı",
    },
  },
  {
    id: "plus",
    name: "Usta Plus",
    badgeTitle: "Plus Usta",
    badgeType: "gold",
    monthlyPrice: 890,
    annualPrice: 8280,
    monthlyEquivalent: 690,
    tagline: "Yoğun çalışan atölyeler, klinikler ve çoklu personel çalıştıran salonlar için.",
    features: {
      listing: "En Üst Sıralarda Vitrin Gösterimi",
      services: "Sınırsız Hizmet + Foto & Portföy Galerisi Vitrini",
      whatsapp: "Çoklu Usta / Koltuk WhatsApp Yönlendirmesi",
      badge: "Plus Usta Rozeti & Güven Damgası",
      physicalKit: "Özel Işıklı / Metal Pleksi QR Standı Kiti",
      commission: "%0 Komisyon Garantisi",
      support: "7/24 Birebir VIP Destek Hattı",
    },
  },
];
