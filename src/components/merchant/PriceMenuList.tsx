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
      <div className="p-3.5 rounded-ios-card bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/20 dark:border-emerald-800/40 flex items-start gap-2.5">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
            Doğrulanmış Şeffaf Fiyat Güvencesi
          </h4>
          <p className="text-[11px] text-emerald-900/80 dark:text-emerald-300/80 leading-relaxed font-medium">
            Herhangi bir hizmete dokunarak doğrudan {merchant.masterName}'ya o işlem için WhatsApp'tan soru sorabilir veya randevu alabilirsiniz.
          </p>
        </div>
      </div>

      {/* iOS Grouped Inset Menu List */}
      <div className="bg-white dark:bg-[#1C1C1E] rounded-ios-card border border-black/[0.04] dark:border-white/[0.08] shadow-ios-card divide-y divide-black/[0.04] dark:divide-white/[0.06] overflow-hidden">
        {merchant.services.map((service) => {
          return (
            <div
              key={service.id}
              onClick={() => handleBookingClick(service)}
              className="p-3.5 sm:p-4 hover:bg-zinc-50/90 dark:hover:bg-zinc-800/60 active:bg-zinc-100 dark:active:bg-zinc-800 transition-colors flex items-center justify-between gap-3 cursor-pointer group ios-press"
            >
              <div className="space-y-0.5 flex-1 pr-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="font-bold text-xs sm:text-sm text-black dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                    {service.name}
                  </h4>
                  {service.popular && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 px-1.5 py-0.2 rounded-full">
                      <Sparkles className="w-2.5 h-2.5 text-amber-700 dark:text-amber-400" /> Popüler
                    </span>
                  )}
                </div>
                {service.description && (
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug line-clamp-1">
                    {service.description}
                  </p>
                )}
                {service.estimatedDuration && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                    <Clock className="w-3 h-3" />
                    <span>{service.estimatedDuration}</span>
                  </span>
                )}
              </div>

              {/* Price & Action Capsule */}
              <div className="flex items-center gap-2.5 shrink-0">
                <div className="text-right">
                  <span className="font-extrabold text-xs sm:text-sm text-black dark:text-white block tracking-tight">
                    {service.minPrice} ₺
                    {service.maxPrice && service.maxPrice !== service.minPrice
                      ? ` - ${service.maxPrice} ₺`
                      : ""}
                  </span>
                </div>

                <div className="p-2 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-xs">
                  <MessageCircle className="w-4 h-4 fill-current" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {merchant.priceNote && (
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 italic px-2 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 shrink-0" />
          {merchant.priceNote}
        </p>
      )}
    </div>
  );
}
