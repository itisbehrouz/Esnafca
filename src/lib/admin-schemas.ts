import { z } from "zod";

/**
 * Zod validation schemas for Esnafça HQ Admin Workstation
 * Compliant with Achord Platform validation standards.
 */

export const subscriptionTierSchema = z.enum(["free", "pro", "plus"]);

export const approveApplicationSchema = z.object({
  applicationId: z.string().min(1, "Başvuru ID zorunludur."),
  operatorNotes: z.string().max(500, "Operatör notu en fazla 500 karakter olabilir.").optional(),
});

export const rejectApplicationSchema = z.object({
  applicationId: z.string().min(1, "Başvuru ID zorunludur."),
  reason: z.string().min(3, "Reddetme gerekçesi en az 3 karakter olmalıdır.").max(500),
});

export const updateMerchantTierSchema = z.object({
  merchantId: z.string().min(1, "Esnaf ID zorunludur."),
  newTier: subscriptionTierSchema,
});

export const toggleVerifiedSchema = z.object({
  merchantId: z.string().min(1, "Esnaf ID zorunludur."),
});

export const deleteMerchantSchema = z.object({
  merchantId: z.string().min(1, "Esnaf ID zorunludur."),
});

export const moderateReviewSchema = z.object({
  reviewId: z.string().min(1, "Yorum ID zorunludur."),
  reason: z.string().min(3, "Silme gerekçesi en az 3 karakter olmalıdır.").max(500).optional(),
});

export const sendBroadcastSchema = z.object({
  target: z.string().min(1, "Hedef kitle seçimi zorunludur."),
  message: z.string().min(5, "Duyuru metni en az 5 karakter olmalıdır.").max(1000, "En fazla 1000 karakter."),
  channel: z.enum(["whatsapp", "sms"]).default("whatsapp"),
});

export const updateAppointmentStatusSchema = z.object({
  appointmentId: z.string().min(1, "Randevu ID zorunludur."),
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]),
});

export const merchantApplicationSubmitSchema = z.object({
  name: z.string().min(2, "Dükkan adı en az 2 karakter olmalıdır."),
  masterName: z.string().min(2, "Usta adı en az 2 karakter olmalıdır."),
  category: z.string().min(2, "Kategori seçilmelidir."),
  experienceYears: z.number().int().min(0).max(80).optional(),
  city: z.string().min(2, "İl zorunludur."),
  district: z.string().min(2, "İlçe zorunludur."),
  neighborhood: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  phone: z.string().min(10, "Geçerli bir telefon numarası giriniz."),
  whatsapp: z.string().optional(),
  plan: z.string().optional(),
  services: z.array(
    z.object({
      name: z.string().min(1, "Hizmet adı girilmelidir."),
      minPrice: z.number().nonnegative(),
      maxPrice: z.number().nonnegative().optional(),
      popular: z.boolean().optional(),
    })
  ).optional(),
});
