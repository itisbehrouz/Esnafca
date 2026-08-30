"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, MapPin, Building2, ShieldCheck, ChevronRight } from "lucide-react";
import { CITIES } from "@/data/cities";
import { MERCHANTS } from "@/data/seed-merchants";

export default function NeighborhoodPage() {
  const [selectedCity, setSelectedCity] = useState<string>("İstanbul");

  const currentCityObj = CITIES.find((c) => c.name === selectedCity) || CITIES[0];

  return (
    <div className="min-h-screen bg-[#F2F2F7] pb-24">
      {/* Apple Translucent Header */}
      <div className="sticky top-0 z-30 ios-blur border-b border-black/[0.06]">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-0.5 text-xs font-bold text-brand ios-press p-1.5 -ml-2 rounded-full hover:bg-black/[0.04]"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Ana Sayfa</span>
          </Link>
          <h1 className="font-extrabold text-sm text-black">Büyükşehir & Mahalle Rehberi</h1>
          <div className="w-12" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        {/* Apple Dark Hero Capsule */}
        <div className="rounded-ios-card bg-black text-white p-5 sm:p-6 shadow-ios-card space-y-2">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold">
            <ShieldCheck className="w-3.5 h-3.5" /> 6 Büyükşehirde Komisyonsuz Ağ
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
            Şeffaf Fiyatlı Mahalle Esnafları
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
            İstanbul, Ankara, İzmir, Bursa, Antalya ve Eskişehir'de zanaatkârları doğrudan WhatsApp ile buluşturan mahalle rehberi.
          </p>
        </div>

        {/* City Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {CITIES.map((c) => (
            <button
              key={c.name}
              onClick={() => setSelectedCity(c.name)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5 ios-press shadow-xs ${
                selectedCity === c.name
                  ? "bg-black text-white"
                  : "bg-white text-zinc-700 border border-black/[0.06] hover:bg-zinc-100"
              }`}
            >
              <span>{c.name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedCity === c.name ? "bg-white/20 text-white" : "bg-black/[0.06] text-zinc-600"
              }`}>
                {MERCHANTS.filter((m) => m.city === c.name).length}
              </span>
            </button>
          ))}
        </div>

        {/* Selected City Districts Grid */}
        <div className="space-y-4 pt-1">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-extrabold text-sm text-black flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-brand" />
              <span>{selectedCity} İlçeleri & Mahalleleri</span>
            </h3>
            <span className="text-[11px] font-bold text-zinc-400">
              {currentCityObj.districts.length} İlçe Aktif
            </span>
          </div>

          <div className="space-y-3">
            {currentCityObj.districts.map((dist) => {
              const districtMerchants = MERCHANTS.filter(
                (m) => m.city === selectedCity && m.district === dist.name
              );

              return (
                <div
                  key={dist.name}
                  className="bg-white rounded-2xl border border-black/[0.06] p-4 space-y-3 shadow-xs"
                >
                  <div className="flex items-center justify-between border-b border-black/[0.04] pb-2.5">
                    <h4 className="font-extrabold text-sm text-black">{dist.name}</h4>
                    <span className="text-[11px] font-bold text-brand">
                      {districtMerchants.length > 0
                        ? `${districtMerchants.length} Kayıtlı Usta`
                        : "Kayıtlar Açık"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-0.5">
                    {dist.neighborhoods.map((nh) => {
                      const nhMerchants = MERCHANTS.filter(
                        (m) =>
                          m.city === selectedCity &&
                          m.district === dist.name &&
                          m.neighborhood.includes(nh.split(" ")[0])
                      );

                      return (
                        <Link
                          key={nh}
                          href={`/?city=${selectedCity}&district=${dist.name}&neighborhood=${encodeURIComponent(nh)}`}
                          className="p-2.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 border border-black/[0.04] transition-all flex items-center justify-between text-xs ios-press"
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <MapPin className="w-3.5 h-3.5 text-brand shrink-0" />
                            <span className="font-semibold text-zinc-800 truncate">{nh}</span>
                          </div>
                          {nhMerchants.length > 0 ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0 ml-1">
                              {nhMerchants.length} Usta
                            </span>
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
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
