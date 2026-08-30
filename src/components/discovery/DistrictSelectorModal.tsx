"use client";

import { useState, useMemo } from "react";
import { X, Search, ChevronRight, ChevronLeft, MapPin, Check, Building2, Sparkles } from "lucide-react";
import { CITIES } from "@/data/cities";
import { City, District } from "@/types";

interface DistrictSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCity: string;
  selectedDistrict: string;
  selectedNeighborhood: string;
  onSelect: (city: string, district: string, neighborhood: string) => void;
}

export function DistrictSelectorModal({
  isOpen,
  onClose,
  selectedCity,
  selectedDistrict,
  selectedNeighborhood,
  onSelect,
}: DistrictSelectorModalProps) {
  // Navigation State: 'cities' | 'districts'
  const [viewState, setViewState] = useState<"cities" | "districts">("cities");
  const [activeCity, setActiveCity] = useState<City>(CITIES[0]);
  const [activeDistrict, setActiveDistrict] = useState<District | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Live Instant Search Filter
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const results: { city: string; district: string; neighborhood: string }[] = [];

    CITIES.forEach((c) => {
      c.districts.forEach((d) => {
        d.neighborhoods.forEach((nh) => {
          if (
            nh.toLowerCase().includes(q) ||
            d.name.toLowerCase().includes(q) ||
            c.name.toLowerCase().includes(q)
          ) {
            results.push({
              city: c.name,
              district: d.name,
              neighborhood: nh,
            });
          }
        });
      });
    });

    return results.slice(0, 15);
  }, [searchQuery]);

  if (!isOpen) return null;

  const handleCityClick = (city: City) => {
    setActiveCity(city);
    setActiveDistrict(null);
    setViewState("districts");
  };

  const handleAllTurkey = () => {
    onSelect("Tüm Şehirler", "Tüm Bölgeler", "");
    onClose();
    setViewState("cities");
  };

  const handleAllCity = (cityName: string) => {
    onSelect(cityName, "Tüm Bölgeler", "");
    onClose();
    setViewState("cities");
  };

  const handleDistrictSelect = (cityName: string, districtName: string) => {
    onSelect(cityName, districtName, "");
    onClose();
    setViewState("cities");
  };

  const handleNeighborhoodSelect = (cityName: string, districtName: string, nhName: string) => {
    onSelect(cityName, districtName, nhName);
    onClose();
    setViewState("cities");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 dark:bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-[#F2F2F7] dark:bg-[#121212] rounded-t-ios-sheet sm:rounded-ios-sheet max-h-[85vh] flex flex-col overflow-hidden shadow-ios-sheet dark:border dark:border-white/[0.08] animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* iOS Grabber Pill */}
        <div className="pt-2.5 pb-1 flex justify-center sm:hidden">
          <div className="w-9 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full" />
        </div>

        {/* Modal Header */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] bg-white/80 dark:bg-[#1C1C1E]/90 backdrop-blur-md">
          {viewState === "districts" ? (
            <button
              onClick={() => setViewState("cities")}
              className="flex items-center gap-1 text-xs font-bold text-brand ios-press py-1 -ml-1 pr-2 rounded-full hover:bg-black/[0.04] dark:hover:bg-white/[0.08]"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
              <span>Şehirler</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-brand" />
              <h2 className="font-extrabold text-black dark:text-white text-sm">Konum Seç</h2>
            </div>
          )}

          <span className="text-xs font-extrabold text-black dark:text-white truncate max-w-[160px]">
            {viewState === "districts" ? activeCity.name : "Tüm Bölgeler"}
          </span>

          <button
            onClick={() => {
              onClose();
              setViewState("cities");
            }}
            className="w-7 h-7 rounded-full bg-zinc-200/80 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-300 ios-press"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Apple Universal Live Search Input */}
        <div className="p-3 bg-white dark:bg-[#1C1C1E] border-b border-black/[0.06] dark:border-white/[0.08]">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
            <input
              type="text"
              autoComplete="off"
              suppressHydrationWarning
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Mahalle veya ilçe ara (Örn: Moda, Alsancak...)"
              className="w-full pl-9 pr-8 py-2 rounded-full bg-zinc-100 dark:bg-zinc-800/80 border border-transparent focus:border-black/[0.08] dark:focus:border-white/[0.15] focus:bg-white dark:focus:bg-zinc-800 text-xs font-medium text-black dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 text-xs font-bold text-zinc-400 dark:text-zinc-500 hover:text-black dark:hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Modal Body Container */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {/* SEARCH RESULTS VIEW (If user types in search box) */}
          {searchQuery.trim() ? (
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-1">
                Arama Sonuçları ({searchResults.length})
              </span>

              {searchResults.length > 0 ? (
                <div className="bg-white dark:bg-[#1C1C1E] rounded-ios border border-black/[0.04] dark:border-white/[0.08] divide-y divide-black/[0.04] dark:divide-white/[0.06] shadow-sm overflow-hidden">
                  {searchResults.map((res, i) => (
                    <button
                      key={i}
                      onClick={() => handleNeighborhoodSelect(res.city, res.district, res.neighborhood)}
                      className="w-full px-4 py-3 text-left text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center justify-between ios-press"
                    >
                      <div className="space-y-0.5">
                        <span className="font-bold text-black dark:text-white block">{res.neighborhood}</span>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                          {res.city} · {res.district}
                        </span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-zinc-400 dark:text-zinc-500 bg-white dark:bg-[#1C1C1E] rounded-ios">
                  Eşleşen mahalle bulunamadı.
                </div>
              )}
            </div>
          ) : viewState === "cities" ? (
            /* STATE 1: CLEAN APPLE CITY SELECTOR */
            <div className="space-y-3">
              {/* Tüm Türkiye Card */}
              <button
                onClick={handleAllTurkey}
                className={`w-full p-3.5 rounded-ios bg-white dark:bg-[#1C1C1E] border border-black/[0.04] dark:border-white/[0.08] shadow-sm flex items-center justify-between text-xs font-extrabold ios-press ${
                  selectedCity === "Tüm Şehirler" ? "text-brand ring-2 ring-brand/30" : "text-black dark:text-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-xs">
                    TR
                  </span>
                  <span>Tüm Türkiye (Tüm Şehirler)</span>
                </div>
                {selectedCity === "Tüm Şehirler" ? (
                  <Check className="w-4 h-4 text-brand stroke-[3]" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600" />
                )}
              </button>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-1">
                  Büyükşehirler
                </span>

                {/* 6 Clean Apple Grid Cards */}
                <div className="grid grid-cols-2 gap-2">
                  {CITIES.map((city) => {
                    const isSelected = selectedCity === city.name;
                    return (
                      <button
                        key={city.name}
                        onClick={() => handleCityClick(city)}
                        className={`p-3.5 rounded-ios text-left bg-white dark:bg-[#1C1C1E] border transition-all shadow-sm flex items-center justify-between ios-press ${
                          isSelected
                            ? "border-brand ring-2 ring-brand/30 text-brand"
                            : "border-black/[0.04] dark:border-white/[0.08] text-black dark:text-white hover:border-zinc-300 dark:hover:border-zinc-600"
                        }`}
                      >
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-sm block tracking-tight">{city.name}</span>
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                            {city.districts.length} İlçe Keşfet →
                          </span>
                        </div>
                        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                          {city.shortCode}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* STATE 2: DRILL-DOWN INTO DISTRICTS & NEIGHBORHOODS */
            <div className="space-y-3 animate-in slide-in-from-right-4 duration-150">
              {/* Show All Current City Button */}
              <button
                onClick={() => handleAllCity(activeCity.name)}
                className="w-full p-3.5 rounded-ios bg-brand text-white shadow-sm flex items-center justify-between text-xs font-bold ios-press"
              >
                <span>Tüm {activeCity.name} Esnaflarını Göster</span>
                <Check className="w-4 h-4 stroke-[2.5]" />
              </button>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-1">
                  {activeCity.name} İlçeleri & Popüler Mahalleler
                </span>

                {/* Clean Accordion-like Grouped District Lists */}
                <div className="space-y-2">
                  {activeCity.districts.map((dist) => {
                    const isExpanded = activeDistrict?.name === dist.name;
                    const isDistrictSelected =
                      selectedCity === activeCity.name && selectedDistrict === dist.name;

                    return (
                      <div
                        key={dist.name}
                        className="bg-white dark:bg-[#1C1C1E] rounded-ios border border-black/[0.04] dark:border-white/[0.08] shadow-sm overflow-hidden"
                      >
                        {/* District Row */}
                        <div className="p-3.5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors">
                          <button
                            onClick={() => handleDistrictSelect(activeCity.name, dist.name)}
                            className="flex-1 text-left font-extrabold text-xs text-black dark:text-white ios-press"
                          >
                            <span>{dist.name}</span>
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-normal block">
                              Tüm {dist.name} esnaflarını seç
                            </span>
                          </button>

                          <button
                            onClick={() => setActiveDistrict(isExpanded ? null : dist)}
                            className="p-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-[11px] font-bold flex items-center gap-1 ios-press ml-2"
                          >
                            <span>{dist.neighborhoods.length} Mahalle</span>
                            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                          </button>
                        </div>

                        {/* Neighborhoods Dropdown Sub-List */}
                        {isExpanded && (
                          <div className="bg-zinc-50/80 dark:bg-[#18181a] border-t border-black/[0.04] dark:border-white/[0.06] p-2 grid grid-cols-1 gap-1">
                            {dist.neighborhoods.map((nh) => {
                              const isNhSelected =
                                isDistrictSelected && selectedNeighborhood === nh;

                              return (
                                <button
                                  key={nh}
                                  onClick={() => handleNeighborhoodSelect(activeCity.name, dist.name, nh)}
                                  className={`px-3 py-2 rounded-lg text-left text-xs font-semibold flex items-center justify-between transition-colors ios-press ${
                                    isNhSelected
                                      ? "bg-brand text-white"
                                      : "hover:bg-white dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                                  }`}
                                >
                                  <span>{nh}</span>
                                  {isNhSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-white/80 dark:bg-[#1C1C1E]/90 border-t border-black/[0.06] dark:border-white/[0.08] text-center">
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
            İpucu: İstediğiniz mahalleyi yukarıdaki arama kutusuna yazarak tek dokunuşla bulabilirsiniz.
          </p>
        </div>
      </div>
    </div>
  );
}
