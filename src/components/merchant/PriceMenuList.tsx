"use client";

import { MessageCircle, CheckCircle2, Info, Sparkles, Clock } from "lucide-react";
import { Merchant, ServiceItem } from "@/types";
import { generateWhatsAppUrl } from "@/lib/whatsapp";

interface PriceMenuListProps {
  merchant: Merchant;
}

export function PriceMenuList({ merchant }: PriceMenuListProps) {
  const handleBookingClick = (service: ServiceItem) => {
    const url = generateWhatsAppUrl(merchant, service);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-3">
      {/* Apple Style Transparency Callout */}
      <div className="p-3.5 rounded-ios-card bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2.5">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <h4 className="text-xs font-bold text-emerald-950">
            Doğrulanmış Şeffaf Fiyat Güvencesi
          </h4>
          <p className="text-[11px] text-emerald-900/80 leading-relaxed font-medium">
            Herhangi bir hizmete dokunarak doğrudan {merchant.masterName}'ya o işlem için WhatsApp'tan soru sorabilir veya randevu alabilirsiniz.
          </p>
        </div>
      </div>

      {/* iOS Grouped Inset Menu List */}
      <div className="bg-white rounded-ios-card border border-black/[0.04] shadow-ios-card divide-y divide-black/[0.04] overflow-hidden">
        {merchant.services.map((service) => {
          return (
            <div
              key={service.id}
              onClick={() => handleBookingClick(service)}
              className="p-3.5 sm:p-4 hover:bg-zinc-50/90 active:bg-zinc-100 transition-colors flex items-center justify-between gap-3 cursor-pointer group ios-press"
            >
              <div className="space-y-0.5 flex-1 pr-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="font-bold text-xs sm:text-sm text-black group-hover:text-emerald-700 transition-colors">
                    {service.name}
                  </h4>
                  {service.popular && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded-full">
                      <Sparkles className="w-2.5 h-2.5 text-amber-700" /> Popüler
                    </span>
                  )}
                </div>
                {service.description && (
                  <p className="text-[11px] text-zinc-500 leading-snug line-clamp-1">
                    {service.description}
                  </p>
                )}
                {service.estimatedDuration && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-zinc-400 font-medium">
                    <Clock className="w-3 h-3" />
                    <span>{service.estimatedDuration}</span>
                  </span>
                )}
              </div>

              {/* Price & Action Capsule */}
              <div className="flex items-center gap-2.5 shrink-0">
                <div className="text-right">
                  <span className="font-extrabold text-xs sm:text-sm text-black block tracking-tight">
                    {service.minPrice} ₺
                    {service.maxPrice && service.maxPrice !== service.minPrice
                      ? ` - ${service.maxPrice} ₺`
                      : ""}
                  </span>
                </div>

                <div className="p-2 rounded-full bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-xs">
                  <MessageCircle className="w-4 h-4 fill-current" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {merchant.priceNote && (
        <p className="text-[11px] text-zinc-400 italic px-2 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 shrink-0" />
          {merchant.priceNote}
        </p>
      )}
    </div>
  );
}
