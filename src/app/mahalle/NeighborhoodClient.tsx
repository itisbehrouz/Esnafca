"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, MapPin, Building2, ShieldCheck, ChevronRight } from "lucide-react";
import { CITIES } from "@/data/cities";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export interface MinimalMerchantLocation {
  id: string;
  city: string;
  district: string;
  neighborhood: string;
}

export function NeighborhoodClient({
  initialMerchants,
}: {
  initialMerchants: MinimalMerchantLocation[];
}) {
  const [selectedCity, setSelectedCity] = useState<string>("İstanbul");
  const currentCityObj = CITIES.find((c) => c.name === selectedCity) || CITIES[0];

  return (
    <div className="min-h-[100dvh] bg-[#F2F2F7] dark:bg-black pb-8 text-black dark:text-white transition-colors duration-200">
      {/* Apple Translucent Header */}
      <div
        className="sticky top-0 z-40 ios-blur dark:bg-black/80 border-b border-black/[0.06] dark:border-white/[0.08] transition-colors pt-safe"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-0.5 text-xs font-bold text-brand ios-press p-1.5 -ml-2 rounded-full hover:bg-black/[0.04] dark:hover:bg-white/[0.08]"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Ana Sayfa</span>
          </Link>
          <h1 className="font-extrabold text-sm text-black dark:text-white">Büyükşehir & Mahalle Rehberi</h1>
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        {/* Apple Dark Hero Capsule */}
        <div className="rounded-ios-card bg-black dark:bg-[#1C1C1E] text-white p-5 sm:p-6 shadow-ios-card border border-white/[0.06] space-y-2">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold">
            <ShieldCheck className="w-3.5 h-3.5" /> 6 Büyükşehirde Komisyonsuz Ağ
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
            Şeffaf Fiyatlı Mahalle Esnafları
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
            İstanbul, Ankara, İzmir, Bursa, Antalya ve Eskişehir&apos;de zanaatkârları doğrudan WhatsApp ile buluşturan mahalle rehberi.
          </p>
        </div>

        {/* City Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 px-1 -mx-1">
          {CITIES.map((c) => (
            <button
              key={c.name}
              onClick={() => setSelectedCity(c.name)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5 ios-press shadow-xs ${
                selectedCity === c.name
                  ? "bg-black dark:bg-white text-white dark:text-black"
                  : "bg-white dark:bg-[#1C1C1E] text-zinc-700 dark:text-zinc-300 border border-black/[0.06] dark:border-white/[0.08] hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <span>{c.name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedCity === c.name 
                  ? "bg-white/20 dark:bg-black/20 text-white dark:text-black" 
                  : "bg-black/[0.06] dark:bg-white/[0.08] text-zinc-600 dark:text-zinc-400"
              }`}>
                {initialMerchants.filter((m) => m.city === c.name).length}
              </span>
            </button>
          ))}
        </div>

        {/* Selected City Districts Grid */}
        <div className="space-y-4 pt-1">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-extrabold text-sm text-black dark:text-white flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-brand" />
              <span>{selectedCity} İlçeleri & Mahalleleri</span>
            </h3>
            <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500">
              {currentCityObj.districts.length} İlçe Aktif
            </span>
          </div>

          <div className="space-y-3">
            {currentCityObj.districts.map((dist) => {
              const districtMerchants = initialMerchants.filter(
                (m) => m.city === selectedCity && m.district === dist.name
              );

              return (
                <div
                  key={dist.name}
                  className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-black/[0.06] dark:border-white/[0.08] p-4 space-y-3 shadow-xs"
                >
                  <div className="flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.06] pb-2.5">
                    <h4 className="font-extrabold text-sm text-black dark:text-white">{dist.name}</h4>
                    <span className="text-[11px] font-bold text-brand">
                      {districtMerchants.length > 0
                        ? `${districtMerchants.length} Kayıtlı Usta`
                        : "Kayıtlar Açık"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-0.5">
                    {dist.neighborhoods.map((nh) => {
                      const nhMerchants = initialMerchants.filter(
                        (m) =>
                          m.city === selectedCity &&
                          m.district === dist.name &&
                          (m.neighborhood || "").includes(nh.split(" ")[0])
                      );

                      return (
                        <Link
                          key={nh}
                          href={`/?city=${selectedCity}&district=${dist.name}&neighborhood=${encodeURIComponent(nh)}`}
                          className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/70 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 border border-black/[0.04] dark:border-white/[0.06] transition-all flex items-center justify-between text-xs ios-press"
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <MapPin className="w-3.5 h-3.5 text-brand shrink-0" />
                            <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">{nh}</span>
                          </div>
                          {nhMerchants.length > 0 ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 shrink-0 ml-1">
                              {nhMerchants.length} Usta
                            </span>
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600 shrink-0" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
