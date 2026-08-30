"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  Search, 
  X, 
  ShieldCheck, 
  MapPin, 
  ChevronDown
} from "lucide-react";
import { MERCHANTS } from "@/data/seed-merchants";
import { CATEGORIES } from "@/data/categories";
import { MerchantCard } from "@/components/merchant/MerchantCard";
import { Navbar } from "@/components/layout/Navbar";
import { DistrictSelectorModal } from "@/components/discovery/DistrictSelectorModal";
import { CategoryId } from "@/types";

const TIER_WEIGHT: Record<string, number> = {
  vip: 4,
  pro: 3,
  vitrin: 2,
  free: 1,
};

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [selectedCity, setSelectedCity] = useState("Tüm Şehirler");
  const [selectedDistrict, setSelectedDistrict] = useState("Tüm Bölgeler");
  const [selectedNeighborhood, setSelectedNeighborhood] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Sync with URL query parameters safely on client
  useEffect(() => {
    const c = searchParams.get("city");
    const d = searchParams.get("district");
    const nh = searchParams.get("neighborhood");
    const cat = (searchParams.get("category") || searchParams.get("cat")) as CategoryId | null;
    const q = searchParams.get("q");

    if (c) setSelectedCity(c);
    if (d) setSelectedDistrict(d);
    if (nh) setSelectedNeighborhood(nh);
    if (cat) setSelectedCategory(cat);
    if (q) setSearchQuery(q);
  }, [searchParams]);

  const filteredMerchants = useMemo(() => {
    const list = MERCHANTS.filter((m) => {
      // 1. City Filter
      if (selectedCity !== "Tüm Şehirler" && m.city !== selectedCity) {
        return false;
      }

      // 2. District Filter
      if (selectedDistrict !== "Tüm Bölgeler" && m.district !== selectedDistrict) {
        return false;
      }

      // 3. Neighborhood Filter
      if (selectedNeighborhood && m.neighborhood !== selectedNeighborhood) {
        return false;
      }

      // 4. Category Filter
      if (selectedCategory !== "all" && m.category !== selectedCategory) {
        return false;
      }

      // 5. Verified Badge Filter
      if (onlyVerified && !m.verified) {
        return false;
      }

      // 6. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = m.name.toLowerCase().includes(query);
        const matchesMaster = m.masterName.toLowerCase().includes(query);
        const matchesCraft = m.craftTitle.toLowerCase().includes(query);
        const matchesCity = m.city.toLowerCase().includes(query);
        const matchesDistrict = m.district.toLowerCase().includes(query);
        const matchesServices = m.services.some((s) => s.name.toLowerCase().includes(query));
        const matchesSpecialties = m.specialties.some((sp) => sp.toLowerCase().includes(query));
        return matchesName || matchesMaster || matchesCraft || matchesCity || matchesDistrict || matchesServices || matchesSpecialties;
      }

      return true;
    });

    // Tier-aware & Alphabetical sort
    return list.slice().sort((a, b) => {
      const weightDiff = (TIER_WEIGHT[b.tier] || 1) - (TIER_WEIGHT[a.tier] || 1);
      if (weightDiff !== 0) return weightDiff;
      return a.name.localeCompare(b.name, "tr");
    });
  }, [selectedCity, selectedDistrict, selectedNeighborhood, selectedCategory, searchQuery, onlyVerified]);

  const activeLocationLabel = selectedNeighborhood 
    ? `${selectedCity} · ${selectedNeighborhood}`
    : selectedDistrict !== "Tüm Bölgeler"
    ? `${selectedCity} · ${selectedDistrict}`
    : selectedCity !== "Tüm Şehirler"
    ? `Tüm ${selectedCity}`
    : "Tüm Türkiye";

  return (
    <div className="min-h-screen bg-[#F2F2F7]">
      {/* Apple Clean Navbar */}
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-3 sm:py-4 space-y-3">
        {/* Single Ultra-Sleek Apple Spotlight Search & Location Bar */}
        <div className="relative flex items-center bg-white rounded-2xl border border-black/[0.06] apple-card-shadow p-1.5 pl-3.5 gap-2">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            type="search"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            data-form-type="other"
            data-lpignore="true"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Usta, işlem veya zanaat arayın..."
            className="w-full bg-transparent border-none text-xs sm:text-sm font-medium text-black placeholder:text-zinc-400 focus:outline-none"
          />

          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="p-1.5 text-zinc-400 hover:text-black ios-press shrink-0 mr-1"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsLocationModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-xs font-bold text-black shrink-0 transition-colors ios-press"
              title="Konumu Değiştir"
            >
              <MapPin className="w-3.5 h-3.5 text-brand shrink-0" />
              <span className="max-w-[110px] sm:max-w-[160px] truncate">{activeLocationLabel}</span>
              <ChevronDown className="w-3 h-3 text-zinc-400 shrink-0" />
            </button>
          )}
        </div>

        {/* Category Strip & Verified Filter */}
        <div className="space-y-2">
          {/* Horizontal Category Carousel */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ios-press ${
                selectedCategory === "all"
                  ? "bg-black text-white shadow-xs"
                  : "bg-white text-zinc-700 border border-black/[0.06] hover:bg-zinc-100"
              }`}
            >
              Tümü ({MERCHANTS.length})
            </button>

            {CATEGORIES.map((cat) => {
              const isCatActive = selectedCategory === cat.id;
              const catCount = MERCHANTS.filter(m => m.category === cat.id).length;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(isCatActive ? "all" : (cat.id as CategoryId))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5 ios-press ${
                    isCatActive
                      ? "bg-brand text-white shadow-xs"
                      : "bg-white text-zinc-700 border border-black/[0.06] hover:bg-zinc-100"
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isCatActive ? "bg-white/20 text-white" : "bg-black/[0.05] text-zinc-500"
                  }`}>
                    {catCount}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Sub-Filter Row */}
          <div className="flex items-center justify-between gap-2 px-1">
            <button
              type="button"
              onClick={() => setOnlyVerified(!onlyVerified)}
              className={`px-3 py-1 rounded-full border text-xs font-bold flex items-center gap-1.5 transition-all ios-press shrink-0 shadow-2xs ${
                onlyVerified
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-zinc-700 border-black/[0.06] hover:bg-zinc-100"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Doğrulanmış Esnaf</span>
            </button>

            <span className="text-zinc-500 font-bold text-xs">
              {filteredMerchants.length} Usta
            </span>
          </div>
        </div>

        {/* Merchant Cards Grid */}
        {filteredMerchants.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {filteredMerchants.map((merchant) => (
              <MerchantCard key={merchant.id} merchant={merchant} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-black/[0.06] p-8 text-center space-y-3 apple-card-shadow">
            <div className="w-12 h-12 rounded-full bg-zinc-100 text-zinc-400 mx-auto flex items-center justify-center">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-black text-sm">
              Aradığınız kriterde esnaf bulunamadı
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Seçtiğiniz şehri veya filtreleri sıfırlayabilirsiniz.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCity("Tüm Şehirler");
                setSelectedDistrict("Tüm Bölgeler");
                setSelectedNeighborhood("");
                setSelectedCategory("all");
                setSearchQuery("");
                setOnlyVerified(false);
                router.push("/");
              }}
              className="px-5 py-2.5 rounded-full bg-black text-white text-xs font-bold ios-press shadow-xs"
            >
              Filtreleri Sıfırla
            </button>
          </div>
        )}
      </main>

      {/* District Selector Modal */}
      <DistrictSelectorModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        selectedCity={selectedCity}
        selectedDistrict={selectedDistrict}
        selectedNeighborhood={selectedNeighborhood}
        onSelect={(city, dist, nh) => {
          setSelectedCity(city);
          setSelectedDistrict(dist);
          setSelectedNeighborhood(nh);
        }}
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F2F2F7]" />}>
      <HomeContent />
    </Suspense>
  );
}
