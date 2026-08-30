"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import L from "leaflet";
import { 
  Search, 
  Crosshair, 
  MapPin, 
  Star, 
  ShieldCheck, 
  Crown, 
  MessageCircle, 
  X, 
  ChevronRight, 
  ChevronDown,
  Layers,
  Plus,
  Minus
} from "lucide-react";
import { Merchant, CategoryId } from "@/types";
import { useTheme } from "@/context/ThemeContext";
import { CATEGORIES } from "@/data/categories";
import { generateWhatsAppUrl } from "@/lib/whatsapp";

export const DISTRICT_COORDINATES: Record<string, [number, number]> = {
  // İstanbul
  "Kadıköy": [40.9910, 29.0295],
  "Moda": [40.9855, 29.0270],
  "Caferağa": [40.9855, 29.0270],
  "Osmanağa": [40.9910, 29.0295],
  "Beşiktaş": [41.0425, 29.0065],
  "Akaretler": [41.0410, 28.9995],
  "Sinanpaşa": [41.0425, 29.0065],
  "Gayrettepe": [41.0665, 29.0125],
  "Levent": [41.0820, 29.0140],
  "Şişli": [41.0585, 28.9810],
  "Bomonti": [41.0585, 28.9810],
  "Nişantaşı": [41.0520, 28.9920],
  "Kağıthane": [41.0820, 28.9730],
  "Gültepe": [41.0780, 28.9950],
  "Sanayi": [41.0920, 28.9910],
  "Üsküdar": [41.0260, 29.0150],
  "Bakırköy": [40.9780, 28.8730],
  "İstanbul": [41.0350, 29.0050],
  // Ankara
  "Çankaya": [39.9050, 32.8600],
  "Tunalı": [39.9050, 32.8600],
  "Kızılay": [39.9208, 32.8541],
  "Ankara": [39.9208, 32.8541],
  // İzmir
  "Konak": [38.4350, 27.1420],
  "Alsancak": [38.4350, 27.1420],
  "Karşıyaka": [38.4570, 27.1120],
  "Bostanlı": [38.4570, 27.1050],
  "İzmir": [38.4237, 27.1428],
  // Bursa & Antalya
  "Bursa": [40.1885, 29.0610],
  "Nilüfer": [40.2150, 28.9850],
  "Antalya": [36.8969, 30.7133],
  "Muratpaşa": [36.8850, 30.7080],
};

interface InteractiveMapViewProps {
  merchants: Merchant[];
  selectedCity?: string;
  selectedDistrict?: string;
  selectedNeighborhood?: string;
  activeLocationLabel?: string;
  onOpenLocationModal?: () => void;
  onClearLocation?: () => void;
  onSelectMerchant?: (merchant: Merchant) => void;
  onSwitchToListMode?: () => void;
}

// Coordinate lookup for mahalle / district centers
function getMerchantCoordinates(m: Merchant): [number, number] {
  if (m.coordinates) return [m.coordinates.lat, m.coordinates.lng];
  const text = `${m.city} ${m.district} ${m.neighborhood}`.toLowerCase();
  
  for (const [key, coords] of Object.entries(DISTRICT_COORDINATES)) {
    if (text.includes(key.toLowerCase())) return coords;
  }

  return [41.0425, 29.0065]; // Beşiktaş / Istanbul default
}

const CATEGORY_EMOJIS: Record<string, string> = {
  "berber-kuafor": "✂️",
  "terzi-lostra": "🧰",
  "oto-bakim": "🚗",
  "acil-ev": "🔑",
  "veteriner": "🐾",
  "atolye-tamir": "🔨",
};

export default function InteractiveMapView({
  merchants,
  selectedCity = "Tüm Şehirler",
  selectedDistrict = "Tüm Bölgeler",
  selectedNeighborhood = "",
  activeLocationLabel = "Tüm Türkiye",
  onOpenLocationModal,
  onClearLocation,
  onSelectMerchant,
  onSwitchToListMode,
}: InteractiveMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.FeatureGroup | null>(null);

  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | "all">("all");
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [onlyPlus, setOnlyPlus] = useState(false);
  
  const [activeMerchant, setActiveMerchant] = useState<Merchant | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  // Filtered merchants for the map
  const filteredMerchants = useMemo(() => {
    return merchants.filter((m) => {
      // 1. City Filter
      if (selectedCity !== "Tüm Şehirler" && m.city !== selectedCity) return false;
      // 2. District Filter
      if (selectedDistrict !== "Tüm Bölgeler" && m.district !== selectedDistrict) return false;
      // 3. Neighborhood Filter
      if (selectedNeighborhood && m.neighborhood !== selectedNeighborhood) return false;

      // 4. Quick Filters
      if (selectedCategory !== "all" && m.category !== selectedCategory) return false;
      if (onlyVerified && !m.verified) return false;
      if (onlyOpen && !m.isOpenNow) return false;
      if (onlyPlus && m.tier !== "plus") return false;

      // 5. Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = m.name.toLowerCase().includes(q);
        const matchesMaster = m.masterName.toLowerCase().includes(q);
        const matchesDistrict = m.district.toLowerCase().includes(q);
        const matchesNh = m.neighborhood.toLowerCase().includes(q);
        const matchesCity = m.city.toLowerCase().includes(q);
        const matchesCraft = m.craftTitle.toLowerCase().includes(q);
        return matchesName || matchesMaster || matchesDistrict || matchesNh || matchesCity || matchesCraft;
      }
      return true;
    });
  }, [
    merchants, 
    selectedCity, 
    selectedDistrict, 
    selectedNeighborhood, 
    selectedCategory, 
    onlyVerified, 
    onlyOpen, 
    onlyPlus, 
    searchQuery
  ]);

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [41.0350, 29.0050], // Istanbul Bosphorus center (Kadıköy + Beşiktaş visible)
      zoom: 13,
      zoomControl: false,
      attributionControl: true,
    });

    // Add OpenStreetMap base tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 19,
      subdomains: ["a", "b", "c"],
    }).addTo(map);

    const markersGroup = L.featureGroup().addTo(map);
    mapInstanceRef.current = map;
    markersGroupRef.current = markersGroup;

    // Click outside marker to close preview sheet
    map.on("click", (e: any) => {
      if (e.originalEvent.target.closest(".esnaf-marker-pin")) return;
      setActiveMerchant(null);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. React to Location Selection (Fly map to selected city / district / neighborhood)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    let targetCoords: [number, number] | null = null;
    let zoomLevel = 13;

    if (selectedNeighborhood) {
      for (const [key, coords] of Object.entries(DISTRICT_COORDINATES)) {
        if (selectedNeighborhood.toLowerCase().includes(key.toLowerCase())) {
          targetCoords = coords;
          zoomLevel = 15;
          break;
        }
      }
    }

    if (!targetCoords && selectedDistrict !== "Tüm Bölgeler") {
      for (const [key, coords] of Object.entries(DISTRICT_COORDINATES)) {
        if (selectedDistrict.toLowerCase().includes(key.toLowerCase())) {
          targetCoords = coords;
          zoomLevel = 14;
          break;
        }
      }
    }

    if (!targetCoords && selectedCity !== "Tüm Şehirler") {
      for (const [key, coords] of Object.entries(DISTRICT_COORDINATES)) {
        if (selectedCity.toLowerCase().includes(key.toLowerCase())) {
          targetCoords = coords;
          zoomLevel = 12;
          break;
        }
      }
    }

    if (targetCoords) {
      map.flyTo(targetCoords, zoomLevel, { duration: 1.2 });
    }
  }, [selectedCity, selectedDistrict, selectedNeighborhood]);

  // 3. Render Markers whenever filteredMerchants or activeMerchant changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = markersGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();
    if (filteredMerchants.length === 0) return;

    filteredMerchants.forEach((m) => {
      const [lat, lng] = getMerchantCoordinates(m);
      const isPlus = m.tier === "plus";
      const emoji = CATEGORY_EMOJIS[m.category] || "📍";
      const priceLabel = `${m.minPrice} ₺`;
      const isSelected = activeMerchant?.id === m.id;

      const bgStyle = isPlus
        ? "background: #F59E0B; color: #FFFFFF; border: 2px solid #FEF08A;"
        : "background: #C4512D; color: #FFFFFF; border: 1.5px solid #FFFFFF;";

      const markerHtml = `
        <div class="esnaf-marker-pin ${isSelected ? "ring-4 ring-white scale-125 z-50" : ""}" style="${bgStyle}">
          <span style="font-size: 13px;">${emoji}</span>
          <span style="font-size: 11px; font-weight: 900; letter-spacing: -0.02em;">${priceLabel}</span>
          ${isPlus ? '<span style="font-size: 10px;">👑</span>' : ""}
        </div>
      `;

      const icon = L.divIcon({
        className: "esnaf-map-marker",
        html: markerHtml,
        iconSize: [84, 32],
        iconAnchor: [42, 16],
      });

      const marker = L.marker([lat, lng], { icon });

      marker.on("click", () => {
        setActiveMerchant(m);
        map.panTo([lat, lng], { animate: true, duration: 0.4 });
        if (onSelectMerchant) onSelectMerchant(m);
      });

      group.addLayer(marker);
    });

    // Auto-fit if user searched specifically
    if (searchQuery.trim() && filteredMerchants.length > 0) {
      const coords = filteredMerchants.map((m) => getMerchantCoordinates(m));
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
    }
  }, [filteredMerchants, activeMerchant, searchQuery, onSelectMerchant]);

  // 4. GPS Locate User with fallback to Location Picker
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      if (onOpenLocationModal) onOpenLocationModal();
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        setUserLocation([latitude, longitude]);

        const map = mapInstanceRef.current;
        if (map) {
          map.flyTo([latitude, longitude], 15, { duration: 1.2 });

          const userDot = L.divIcon({
            className: "user-gps-dot",
            html: `
              <div class="relative flex items-center justify-center w-6 h-6">
                <div class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></div>
                <div class="relative inline-flex rounded-full h-4 w-4 bg-blue-600 border-2 border-white shadow-md"></div>
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });
          L.marker([latitude, longitude], { icon: userDot }).addTo(map);
        }
      },
      () => {
        setIsLocating(false);
        // If GPS is disabled/blocked, smoothly open location selector modal for the user!
        if (onOpenLocationModal) {
          onOpenLocationModal();
        } else {
          const map = mapInstanceRef.current;
          if (map) map.flyTo([41.0425, 29.0065], 14, { duration: 1.0 });
        }
      },
      { enableHighAccuracy: false, timeout: 6000 }
    );
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  return (
    <div className="relative w-full h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] overflow-hidden bg-zinc-100 dark:bg-black">
      {/* 1. Leaflet Map Element */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* 2. Floating Top Search & Quick Filters Card (Matching Inspiration Screenshot) */}
      <div className="absolute top-3 left-3 right-3 sm:left-6 sm:right-auto sm:w-[500px] z-30 space-y-2 pointer-events-auto">
        <div className="bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-xl rounded-3xl border border-black/[0.08] dark:border-white/[0.12] p-3 sm:p-3.5 shadow-2xl space-y-2.5 transition-all">
          {/* Search Input Bar with Location Picker & GPS Action */}
          <div className="flex items-center gap-2">
            {/* Location Selector Pill Button */}
            {onOpenLocationModal && (
              <button
                type="button"
                onClick={onOpenLocationModal}
                className="flex items-center gap-1 px-2.5 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-bold text-black dark:text-white shrink-0 transition-all ios-press border border-black/[0.04] dark:border-white/[0.06]"
                title="Şehir ve İlçe Değiştir"
              >
                <MapPin className="w-3.5 h-3.5 text-brand shrink-0" />
                <span className="max-w-[100px] sm:max-w-[130px] truncate">{activeLocationLabel}</span>
                <ChevronDown className="w-3 h-3 text-zinc-400 shrink-0" />
              </button>
            )}

            {/* Search Input */}
            <div className="relative flex-1 flex items-center">
              <Search className="absolute left-3 w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
              <input
                type="text"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                data-form-type="other"
                data-lpignore="true"
                suppressHydrationWarning
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Usta veya zanaat ara..."
                className="w-full pl-8 pr-7 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold text-black dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 p-1 rounded-full text-zinc-400 hover:text-black dark:hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Blue Apple Search Action Button */}
            <button
              type="button"
              className="px-3.5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-extrabold shadow-sm transition-all ios-press shrink-0"
            >
              Ara
            </button>

            {/* GPS Locate Icon Button */}
            <button
              type="button"
              onClick={handleLocateMe}
              disabled={isLocating}
              title="Konumumu Bul (GPS)"
              className={`p-2.5 rounded-2xl border transition-all ios-press shrink-0 flex items-center justify-center ${
                isLocating
                  ? "bg-blue-50 dark:bg-blue-950/60 border-blue-400 text-blue-600 animate-spin"
                  : "bg-zinc-100 dark:bg-zinc-800 border-black/[0.04] dark:border-white/[0.08] text-zinc-700 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400"
              }`}
            >
              <Crosshair className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Filter Chips (Matching Inspiration Carousel) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 pt-0.5">
            {/* Live Open Chip */}
            <button
              type="button"
              onClick={() => setOnlyOpen(!onlyOpen)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all shrink-0 flex items-center gap-1 ios-press ${
                onlyOpen
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Açık Olanlar</span>
            </button>

            {/* Verified Chip */}
            <button
              type="button"
              onClick={() => setOnlyVerified(!onlyVerified)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all shrink-0 flex items-center gap-1 ios-press ${
                onlyVerified
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              <ShieldCheck className="w-3 h-3 text-blue-500" />
              <span>Doğrulanmış</span>
            </button>

            {/* Plus Ustalar Chip */}
            <button
              type="button"
              onClick={() => setOnlyPlus(!onlyPlus)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all shrink-0 flex items-center gap-1 ios-press ${
                onlyPlus
                  ? "bg-amber-500 text-white shadow-xs"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              <span>👑 Plus Usta</span>
            </button>

            {/* Categories Chips */}
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const emoji = CATEGORY_EMOJIS[cat.id] || "📍";

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(isSelected ? "all" : (cat.id as CategoryId))}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all shrink-0 flex items-center gap-1 ios-press ${
                    isSelected
                      ? "bg-brand text-white shadow-xs"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  <span>{emoji}</span>
                  <span>{cat.name.split("&")[0].trim()}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Floating Zoom Controls (Right Side) */}
      <div className="absolute right-4 top-20 z-20 hidden sm:flex flex-col gap-1.5 pointer-events-auto">
        <div className="bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-md rounded-2xl border border-black/[0.08] dark:border-white/[0.1] shadow-lg p-1 flex flex-col">
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-8 h-8 rounded-xl hover:bg-black/[0.05] dark:hover:bg-white/[0.08] text-black dark:text-white flex items-center justify-center font-bold ios-press"
            title="Yakınlaş"
          >
            <Plus className="w-4 h-4" />
          </button>
          <div className="w-full h-px bg-black/[0.06] dark:bg-white/[0.08]" />
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-8 h-8 rounded-xl hover:bg-black/[0.05] dark:hover:bg-white/[0.08] text-black dark:text-white flex items-center justify-center font-bold ios-press"
            title="Uzaklaş"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4. Active Merchant Floating Place Sheet (Apple Maps / Airbnb Style) */}
      {activeMerchant && (
        <div className="absolute bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:w-96 z-30 pointer-events-auto animate-in slide-in-from-bottom-6 duration-200">
          <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl border border-black/[0.08] dark:border-white/[0.1] shadow-2xl p-4 space-y-3">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setActiveMerchant(null)}
              className="absolute top-3 right-3 w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-black dark:hover:text-white flex items-center justify-center ios-press z-10"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Merchant Quick Header */}
            <div className="flex gap-3">
              <img
                src={activeMerchant.heroImage}
                alt={activeMerchant.name}
                className="w-20 h-20 rounded-2xl object-cover shrink-0 shadow-xs"
              />

              <div className="space-y-1 flex-1 pr-6">
                <div className="flex items-center gap-1 text-[10px] font-bold text-brand uppercase tracking-wider">
                  <span>{activeMerchant.craftTitle}</span>
                </div>
                <h3 className="font-extrabold text-sm text-black dark:text-white leading-tight line-clamp-1">
                  {activeMerchant.name}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                  {activeMerchant.masterName} · {activeMerchant.experienceYears} Yıl Deneyim
                </p>
                <div className="flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-300">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="font-bold">{activeMerchant.rating}</span>
                  <span className="text-[10px] text-zinc-400">({activeMerchant.reviewCount})</span>
                  <span className="mx-1 text-zinc-300 dark:text-zinc-700">·</span>
                  <span className="text-[11px] font-medium truncate">{activeMerchant.neighborhood}</span>
                </div>
              </div>
            </div>

            {/* Transparent Price & Quick WhatsApp Action */}
            <div className="pt-2 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Şeffaf Fiyat
                </span>
                <span className="text-sm font-extrabold text-black dark:text-white">
                  {activeMerchant.minPrice} ₺ - {activeMerchant.maxPrice} ₺
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <Link
                  href={`/esnaf/${activeMerchant.slug}`}
                  className="px-3 py-2 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-black dark:text-white text-xs font-bold transition-all ios-press flex items-center gap-1"
                >
                  <span>Detay</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>

                <a
                  href={generateWhatsAppUrl(activeMerchant)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-extrabold transition-all ios-press flex items-center gap-1.5 shadow-sm"
                >
                  <MessageCircle className="w-3.5 h-3.5 fill-white/20" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Bottom Center Switcher: Switch between Map & Grid List */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
        <button
          type="button"
          onClick={onSwitchToListMode}
          className="px-5 py-2.5 rounded-full bg-black/90 dark:bg-white/95 backdrop-blur-md text-white dark:text-black text-xs font-extrabold shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 ios-press"
        >
          <Layers className="w-4 h-4" />
          <span>Liste Görünümüne Geç ({filteredMerchants.length} Usta)</span>
        </button>
      </div>
    </div>
  );
}
