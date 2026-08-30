export type SubscriptionTierId = "free" | "vitrin" | "pro" | "vip";

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
  vipExclusive?: boolean;
  highlightColor: string;
  features: {
    listing: string;
    services: string;
    whatsapp: string;
    badge: string;
    physicalKit: string;
    autoReply: string;
    reporting: string;
    quota: string;
  };
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Mahalleli",
    badgeTitle: "Standart Dizin",
    badgeType: "none",
    monthlyPrice: 0,
    annualPrice: 0,
    monthlyEquivalent: 0,
    tagline: "Küçük esnafın dijitalde ilk adımı atması için tamamen ücretsiz.",
    highlightColor: "border-stone-200 bg-white",
    features: {
      listing: "Standart Dizin Listelemesi",
      services: "5 Temel Hizmet & Fiyat",
      whatsapp: "Doğrudan WhatsApp Linki",
      badge: "Rozet Yok",
      physicalKit: "Fiziki Kit Yok",
      autoReply: "Yok",
      reporting: "Raporlama Yok",
      quota: "Sınırsız Katılım",
    },
  },
  {
    id: "vitrin",
    name: "Esnafça Vitrin",
    badgeTitle: "Mavi Doğrulanmış Rozet",
    badgeType: "blue",
    monthlyPrice: 349,
    annualPrice: 2990,
    monthlyEquivalent: 249,
    tagline: "Şeffaf fiyatlarını öne çıkar, mahallede güven damgası kazan.",
    highlightColor: "border-brand/30 bg-esnaf-50/40",
    features: {
      listing: "Öncelikli Arama Listelemesi",
      services: "Sınırsız Hizmet & Fiyat Listesi",
      whatsapp: "Şablonlu Önceden Doldurulmuş Mesaj",
      badge: "Doğrulanmış Esnaf (Mavi Rozet)",
      physicalKit: "Vitrin Çıkartması (Karekod Kit)",
      autoReply: "Yok",
      reporting: "Aylık Özet SMS Raporu",
      quota: "Sınırsız",
    },
  },
  {
    id: "pro",
    name: "Esnafça Usta (Pro)",
    badgeTitle: "Pro Mavi Rozet",
    badgeType: "blue",
    monthlyPrice: 799,
    annualPrice: 6990,
    monthlyEquivalent: 582,
    popular: true,
    tagline: "En çok tercih edilen: Üst sıralarda listelen, tezgâhına şık pleksi QR standı koy.",
    highlightColor: "border-brand bg-white ring-2 ring-brand shadow-lg",
    features: {
      listing: "Kategoride Üst Sıralarda Gösterim",
      services: "Sınırsız Hizmet + Foto Galeri",
      whatsapp: "Şablonlu Mesaj + Hızlı Yanıt",
      badge: "Doğrulanmış Esnaf (Mavi Rozet)",
      physicalKit: "Vitrin Çıkartması + Tezgâh Pleksi QR Standı",
      autoReply: "Mesai Dışı Otomatik WhatsApp Şablonu",
      reporting: "Detaylı Haftalık WhatsApp Raporu",
      quota: "Sınırsız",
    },
  },
  {
    id: "vip",
    name: "Mahalle Lideri (VIP)",
    badgeTitle: "Altın VIP Lider Rozeti",
    badgeType: "gold",
    monthlyPrice: 1750,
    annualPrice: 15900,
    monthlyEquivalent: 1325,
    vipExclusive: true,
    tagline: "Mahallenin 1 numaralı lider ustası ol. Her mahallede sadece 1 esnaf!",
    highlightColor: "border-amber-400 bg-gradient-to-b from-amber-50/60 to-white shadow-xl",
    features: {
      listing: "En Üstte Sabit Listeleme (Slot 1-2)",
      services: "Sınırsız Hizmet + Video & Portföy Vitrini",
      whatsapp: "Özel Şablonlu Mesaj Akışı",
      badge: "Mahalle Lideri (Altın VIP Rozet)",
      physicalKit: "Özel Metal / Işıklı Vitrin Kiti + Tezgâh Pleksi",
      autoReply: "Özelleştirilebilir 7/24 Akıllı WhatsApp Botu",
      reporting: "Detaylı Rapor + Mahalle Talep & Rakip Analizi",
      quota: "Mahalle & Kategori Başına Sadece 1 Esnaf",
    },
  },
];
