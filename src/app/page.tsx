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
import { getAllMerchants } from "@/lib/merchant-store";
import { MERCHANTS as INITIAL_MERCHANTS } from "@/data/seed-merchants";
import { CATEGORIES } from "@/data/categories";
import { MerchantCard } from "@/components/merchant/MerchantCard";
import { Navbar } from "@/components/layout/Navbar";
import { DistrictSelectorModal } from "@/components/discovery/DistrictSelectorModal";
import { CategoryId, Merchant } from "@/types";

const TIER_WEIGHT: Record<string, number> = {
  plus: 3,
  pro: 2,
  free: 1,
};

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [merchants, setMerchants] = useState<Merchant[]>(INITIAL_MERCHANTS);
  const [selectedCity, setSelectedCity] = useState("Tüm Şehirler");
  const [selectedDistrict, setSelectedDistrict] = useState("Tüm Bölgeler");
  const [selectedNeighborhood, setSelectedNeighborhood] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  const loadMerchants = () => {
    setMerchants(getAllMerchants());
  };

  useEffect(() => {
    loadMerchants();
    window.addEventListener("merchants_updated", loadMerchants);
    return () => window.removeEventListener("merchants_updated", loadMerchants);
  }, []);

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
    const list = merchants.filter((m) => {
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

    // Sort: Priority by Tier (Plus -> Pro -> Free) -> Rating -> ReviewCount
    return [...list].sort((a, b) => {
      const weightA = TIER_WEIGHT[a.tier] || 0;
      const weightB = TIER_WEIGHT[b.tier] || 0;
      if (weightB !== weightA) return weightB - weightA;
      if (b.rating !== a.rating) return b.rating - a.rating;
      return b.reviewCount - a.reviewCount;
    });
  }, [
    merchants,
    selectedCity,
    selectedDistrict,
    selectedNeighborhood,
    selectedCategory,
    onlyVerified,
    searchQuery,
  ]);

  const activeLocationLabel = useMemo(() => {
    if (selectedNeighborhood && selectedDistrict !== "Tüm Bölgeler") {
      return `${selectedNeighborhood}, ${selectedDistrict}`;
    }
    if (selectedDistrict !== "Tüm Bölgeler") {
      return `${selectedDistrict}, ${selectedCity}`;
    }
    if (selectedCity !== "Tüm Şehirler") {
      return selectedCity;
    }
    return "Tüm Türkiye";
  }, [selectedCity, selectedDistrict, selectedNeighborhood]);

  const clearLocationFilter = () => {
    setSelectedCity("Tüm Şehirler");
    setSelectedDistrict("Tüm Bölgeler");
    setSelectedNeighborhood("");
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] dark:bg-black pb-28 text-black dark:text-white transition-colors duration-200" suppressHydrationWarning>
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 pt-3 space-y-3">
        {/* Apple Spotlight Search + Dynamic Location Trigger */}
        <div className="flex items-center gap-2">
          {/* Search Input Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
            <input
              type="text"
              autoComplete="off"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Usta, işlem veya zanaat arayın..."
              className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] text-sm text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Location Trigger Pill Button */}
          <button
            type="button"
            onClick={() => setIsLocationModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all shadow-2xs shrink-0 text-xs font-bold text-black dark:text-white ios-press"
          >
            <MapPin className="w-3.5 h-3.5 text-brand shrink-0" />
            <span className="max-w-[130px] sm:max-w-[200px] truncate">{activeLocationLabel}</span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          </button>
        </div>

        {/* Categories Horizontal Carousel */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ios-press ${
                selectedCategory === "all"
                  ? "bg-black dark:bg-white text-white dark:text-black shadow-xs"
                  : "bg-white dark:bg-[#1C1C1E] text-zinc-700 dark:text-zinc-300 border border-black/[0.06] dark:border-white/[0.08] hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              Tümü ({merchants.length})
            </button>

            {CATEGORIES.map((cat) => {
              const isCatActive = selectedCategory === cat.id;
              const catCount = merchants.filter(m => m.category === cat.id).length;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(isCatActive ? "all" : (cat.id as CategoryId))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5 ios-press ${
                    isCatActive
                      ? "bg-brand text-white shadow-xs"
                      : "bg-white dark:bg-[#1C1C1E] text-zinc-700 dark:text-zinc-300 border border-black/[0.06] dark:border-white/[0.08] hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isCatActive ? "bg-white/20 text-white" : "bg-black/[0.05] dark:bg-white/[0.08] text-zinc-500 dark:text-zinc-400"
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
                  : "bg-white dark:bg-[#1C1C1E] text-zinc-700 dark:text-zinc-300 border-black/[0.06] dark:border-white/[0.08] hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Doğrulanmış Esnaf</span>
            </button>

            <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500">
              {filteredMerchants.length} Usta
            </span>
          </div>
        </div>

        {/* Merchant Cards Grid */}
        {filteredMerchants.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
            {filteredMerchants.map((merchant) => (
              <MerchantCard key={merchant.id} merchant={merchant} />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] p-10 text-center space-y-4 shadow-xs mt-4">
            <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mx-auto flex items-center justify-center">
              <Search className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-black dark:text-white">
                Bu kriterlere uygun esnaf bulunamadı
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                Konum filtrenizi genişletebilir veya arama teriminizi değiştirebilirsiniz.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                clearLocationFilter();
                setSelectedCategory("all");
                setSearchQuery("");
                setOnlyVerified(false);
              }}
              className="px-5 py-2.5 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-bold ios-press shadow-xs"
            >
              Filtreleri Sıfırla
            </button>
          </div>
        )}
      </main>

      {/* District & City Selector Modal */}
      <DistrictSelectorModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        selectedCity={selectedCity}
        selectedDistrict={selectedDistrict}
        selectedNeighborhood={selectedNeighborhood}
        onSelectLocation={(city, district, neighborhood) => {
          setSelectedCity(city);
          setSelectedDistrict(district);
          setSelectedNeighborhood(neighborhood || "");
        }}
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F2F2F7] dark:bg-black" />}>
      <HomeContent />
    </Suspense>
  );
}
