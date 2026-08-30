import { Merchant, ServiceItem } from "@/types";

export function generateWhatsAppUrl(
  merchant: Merchant,
  service?: ServiceItem,
  customNote?: string
): string {
  const cleanPhone = merchant.whatsapp.replace(/[^0-9]/g, "");
  
  let message = `Selam ${merchant.masterName || merchant.name},\n`;
  message += `Esnafça üzerinden ulaşıyorum.\n\n`;

  if (service) {
    message += `*İlgilendiğim Hizmet:* ${service.name}\n`;
    if (service.maxPrice && service.maxPrice !== service.minPrice) {
      message += `*Fiyat Aralığı:* ${service.minPrice} TL - ${service.maxPrice} TL\n`;
    } else {
      message += `*Fiyat:* ${service.minPrice} TL ${service.isStartingPrice ? "(başlangıç)" : ""}\n`;
    }
  } else {
    message += `Dükkanınızdaki hizmetler hakkında bilgi almak ve randevu/fiyat teyidi yapmak istiyorum.\n`;
  }

  if (customNote) {
    message += `\n*Notum:* ${customNote}\n`;
  }

  message += `\nMüsaitliğiniz hakkında bilgi alabilir miyim? Teşekkürler!`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export function generateWindowQrUrl(merchantSlug: string): string {
  return `https://esnafca.com/esnaf/${merchantSlug}`;
}
