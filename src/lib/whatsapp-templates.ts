/**
 * Standardize Turkish and international phone numbers for WhatsApp wa.me links.
 * Converts 05321234567 or 5321234567 to 905321234567.
 */
export function formatPhoneForWhatsApp(phone: string): string {
  const digits = (phone || "").replace(/\D/g, "");
  if (digits.startsWith("90") && digits.length >= 12) {
    return digits;
  }
  if (digits.startsWith("0") && digits.length === 11) {
    return `9${digits}`;
  }
  if (digits.length === 10) {
    return `90${digits}`;
  }
  return digits;
}

export interface WhatsAppAppointmentData {
  id?: string;
  customerName: string;
  customerPhone?: string;
  date: string;
  startTime: string;
  price?: number;
  endTime?: string | null;
  customerNote?: string | null;
  service?: { name: string } | null;
  merchant?: {
    name: string;
    masterName?: string;
    address?: string;
    phone?: string;
    slug?: string;
  } | null;
}

/**
 * 1. Alert Merchant when customer creates a new booking.
 */
export function getNewBookingMerchantAlert(
  merchantPhone: string,
  appointment: WhatsAppAppointmentData & { id: string }
): string {
  const cleanPhone = formatPhoneForWhatsApp(merchantPhone);
  const code = appointment.id.slice(-6).toUpperCase();
  const masterName = appointment.merchant?.masterName || appointment.merchant?.name || "Usta";
  const serviceName = appointment.service?.name || "Genel Randevu & Ön İnceleme";

  let msg = `Selam ${masterName},\n`;
  msg += `Esnafça üzerinden yeni bir online randevu talebi alındı.\n\n`;
  msg += `📋 *Randevu Kodu:* #${code}\n`;
  msg += `📅 *Tarih:* ${appointment.date}\n`;
  msg += `⏰ *Saat:* ${appointment.startTime}${appointment.endTime ? ` - ${appointment.endTime}` : ""}\n`;
  msg += `✂️ *Hizmet:* ${serviceName}\n`;
  msg += `💰 *Tutar:* ${appointment.price ?? 0} ₺\n`;
  msg += `👤 *Müşteri:* ${appointment.customerName}\n`;

  if (appointment.customerPhone) {
    msg += `📞 *İletişim:* ${appointment.customerPhone}\n`;
  }

  if (appointment.customerNote?.trim()) {
    msg += `📝 *Müşteri Notu:* ${appointment.customerNote.trim()}\n`;
  }

  msg += `\nRandevuyu onaylıyor musunuz?`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
}

/**
 * 2. Send confirmation message to customer with appointment details and cancellation info.
 */
export function getBookingConfirmationCustomerMessage(
  customerPhone: string,
  appointment: WhatsAppAppointmentData
): string {
  const cleanPhone = formatPhoneForWhatsApp(customerPhone);
  const code = appointment.id ? appointment.id.slice(-6).toUpperCase() : "ESNAFCA";
  const merchantName = appointment.merchant?.name || "Esnafça Dükkanı";
  const masterName = appointment.merchant?.masterName;
  const serviceName = appointment.service?.name || "Randevulu Hizmet";
  const address = appointment.merchant?.address;

  let msg = `Merhaba ${appointment.customerName},\n`;
  msg += `${merchantName}${masterName ? ` (${masterName})` : ""} dükkanımız için randevunuz onaylanmıştır.\n\n`;
  msg += `📋 *Randevu No:* #${code}\n`;
  msg += `📅 *Tarih:* ${appointment.date}\n`;
  msg += `⏰ *Saat:* ${appointment.startTime}${appointment.endTime ? ` - ${appointment.endTime}` : ""}\n`;
  msg += `✂️ *İşlem:* ${serviceName}\n`;

  if (appointment.price !== undefined) {
    msg += `💰 *Hizmet Tutarı:* ${appointment.price} ₺\n`;
  }

  if (address) {
    msg += `📍 *Adres:* ${address}\n`;
  }

  msg += `\nRandevu saatinden 5-10 dakika önce gelmenizi rica ederiz.`;
  msg += `\nRandevunuzu ertelemek veya iptal etmek için bize bu numaradan ulaşabilirsiniz.\n`;
  msg += `Görüşmek üzere!`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
}

/**
 * 3. Pre-written reminder message for the merchant to send 2 hours before the visit.
 */
export function getReminderCustomerMessage(
  customerPhone: string,
  appointment: WhatsAppAppointmentData
): string {
  const cleanPhone = formatPhoneForWhatsApp(customerPhone);
  const merchantName = appointment.merchant?.name || "Esnafça Ustası";
  const serviceName = appointment.service?.name || "randevulu işleminiz";
  const address = appointment.merchant?.address;

  let msg = `Merhaba ${appointment.customerName},\n`;
  msg += `Bugün saat ${appointment.startTime}'de ${merchantName} dükkanımızdaki ${serviceName} için randevunuzu hatırlatmak isteriz.\n\n`;

  if (address) {
    msg += `📍 *Konum / Adres:* ${address}\n\n`;
  }

  msg += `Sizi ağırlamaktan mutluluk duyacağız. Bir değişiklik olursa lütfen bize buradan bilgi verin!`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
}
