"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
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
  ChevronUp,
  Plus, 
  Minus, 
  Loader2, 
  Navigation,
  Footprints,
  Scissors,
  Car,
  KeyRound,
  Dog,
  Hammer,
  Sparkles,
  CircleDollarSign,
  LucideIcon
} from "lucide-react";
import { Merchant, CategoryId } from "@/types";
import { useTheme } from "@/context/ThemeContext";
import { CATEGORIES } from "@/data/categories";
import { generateWhatsAppUrl } from "@/lib/whatsapp";
import { 
  LOCATION_COORDINATES, 
  getMerchantCoordinates, 
  getCoordinatesForLocation, 
  getDistanceInMeters 
} from "@/data/coordinates";


const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  "berber": Scissors,
  "kuafor": Sparkles,
  "guzellik": Sparkles,
  "cilingir": KeyRound,
  "elektrikci": KeyRound,
  "tesisat": Hammer,
  "kucuk-ev-aletleri": Hammer,
  "bisiklet-tamir": KeyRound,
  "oto-tamir": Car,
  "oto-yikama": Sparkles,
  "oto-lastik": Car,
  "terzi": Scissors,
  "lostra": Footprints,
  "kuru-temizleme": Sparkles,
  "veteriner": Dog,
  "pet-kuafor": Dog,
};

// SVG strings for Leaflet divIcon markers
function getCategoryPinSvg(category: string): string {
  if (category.includes("berber") || category.includes("terzi")) {
    return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>`;
  }
  if (category.includes("oto")) {
    return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 11 2 11.5 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>`;
  }
  if (category.includes("acil") || category.includes("cilingir")) {
    return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"/><circle cx="16.5" cy="7.5" r=".5" fill="currentColor"/></svg>`;
  }
  if (category.includes("vet") || category.includes("pet")) {
    return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08 1 1 2 2 2h2"/><path d="M14 5.172C14 3.782 15.577 2.679 17.5 3c2.823.47 4.113 6.006 4 7-.08 1-1 2-2 2h-2"/><path d="M8 14v.5"/><path d="M16 14v.5"/><path d="M11.25 16.25h1.5L12 17l-.75-.75z"/></svg>`;
  }
  // Default Hammer
  return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 12-8.373 8.373a1 1 0 1 1-3-3L12 9"/><path d="m18 15 4-4"/><path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172V7l-2.26-2.26a6 6 0 0 0-4.202-1.756L9 2.96l.92.82A6.18 6.18 0 0 1 12 8.4V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5"/></svg>`;
}

const CROWN_SVG = `<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14v2H5v-2z"/></svg>`;

function formatDistance(meters: number): { distance: string; walkTime: string } {
  const distance = meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
  const walkMins = Math.max(1, Math.round(meters / 80));
  const walkTime = walkMins < 60 ? `${walkMins} dk yürüme` : `${Math.round(walkMins / 60)} sa yürüme`;
  return { distance, walkTime };
}

interface InteractiveMapViewProps {
  merchants: Merchant[];
  selectedCity?: string;
  selectedDistrict?: string;
  selectedNeighborhood?: string;
  activeLocationLabel?: string;
  onOpenLocationModal?: () => void;
  onClearLocation?: () => void;
  onSelectMerchant?: (merchant: Merchant) => void;
  onSelectLocation?: (city: string, district: string, neighborhood?: string) => void;
  onSwitchToListMode?: () => void;
}

export default function InteractiveMapView({
  merchants,
  selectedCity = "Tüm Şehirler",
  selectedDistrict = "Tüm Bölgeler",
  selectedNeighborhood = "",
  activeLocationLabel = "Tüm Türkiye",
  onOpenLocationModal,
  onClearLocation,
  onSelectMerchant,
  onSelectLocation,
  onSwitchToListMode,
}: InteractiveMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.FeatureGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | "all">("all");
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [onlyPlus, setOnlyPlus] = useState(false);
  
  const [sortBy, setSortBy] = useState<"nearest" | "rating" | "price">("nearest");
  const [isDrawerExpanded, setIsDrawerExpanded] = useState(false);
  const [activeMerchant, setActiveMerchant] = useState<Merchant | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  // Filtered & Sorted merchants with distance
  const filteredMerchantsWithDistance = useMemo(() => {
    const list = merchants.filter((m) => {
      if (selectedCity !== "Tüm Şehirler" && m.city !== selectedCity) return false;
      if (selectedDistrict !== "Tüm Bölgeler" && m.district !== selectedDistrict) return false;
      if (selectedNeighborhood && m.neighborhood !== selectedNeighborhood) return false;

      if (selectedCategory !== "all" && m.category !== selectedCategory) return false;
      if (onlyVerified && !m.verified) return false;
      if (onlyOpen && !m.isOpenNow) return false;
      if (onlyPlus && m.tier !== "plus") return false;

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

    const withDistance = list.map((m) => {
      const [mLat, mLon] = getMerchantCoordinates(m);
      let distanceMeters = 500;
      if (userLocation) {
        distanceMeters = getDistanceInMeters(userLocation[0], userLocation[1], mLat, mLon);
      }
      const { distance, walkTime } = formatDistance(distanceMeters);
      return {
        ...m,
        coords: [mLat, mLon] as [number, number],
        distanceMeters,
        distanceLabel: distance,
        walkTimeLabel: walkTime,
      };
    });

    return withDistance.sort((a, b) => {
      if (sortBy === "nearest" && userLocation) {
        return a.distanceMeters - b.distanceMeters;
      }
      if (sortBy === "rating") {
        return b.rating - a.rating;
      }
      if (sortBy === "price") {
        return a.minPrice - b.minPrice;
      }
      if (a.tier === "plus" && b.tier !== "plus") return -1;
      if (b.tier === "plus" && a.tier !== "plus") return 1;
      return a.distanceMeters - b.distanceMeters;
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
    searchQuery,
    userLocation,
    sortBy,
  ]);

  const isGpsLocatingRef = useRef(false);

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [41.0775, 28.9665],
      zoom: 14,
      zoomControl: false,
      attributionControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 19,
      subdomains: ["a", "b", "c"],
    }).addTo(map);

    const markersGroup = L.featureGroup().addTo(map);
    mapInstanceRef.current = map;
    markersGroupRef.current = markersGroup;

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

  // 2. React to Location Selection
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (isGpsLocatingRef.current) return;

    const targetCoords = getCoordinatesForLocation(selectedCity, selectedDistrict, selectedNeighborhood);
    if (targetCoords) {
      const zoomLevel = selectedNeighborhood ? 15 : (selectedDistrict !== "Tüm Bölgeler" ? 14 : 12);
      map.flyTo(targetCoords, zoomLevel, { duration: 1.2 });
    }
  }, [selectedCity, selectedDistrict, selectedNeighborhood]);

  // 3. Render Markers on map with Pure SVG Icons
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = markersGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();
    if (filteredMerchantsWithDistance.length === 0) return;

    filteredMerchantsWithDistance.forEach((m) => {
      const [lat, lng] = m.coords;
      const isPlus = m.tier === "plus";
      const iconSvg = getCategoryPinSvg(m.category);
      const badgeText = userLocation ? m.distanceLabel : `${m.minPrice} ₺`;
      const isSelected = activeMerchant?.id === m.id;

      const bgStyle = isPlus
        ? "background: #F59E0B; color: #FFFFFF; border: 2px solid #FEF08A;"
        : "background: #2563EB; color: #FFFFFF; border: 2px solid #FFFFFF;";

      const markerHtml = `
        <div class="esnaf-marker-pin ${isSelected ? "ring-4 ring-blue-400 scale-125 z-50" : ""}" style="${bgStyle}">
          <span class="flex items-center justify-center">${iconSvg}</span>
          <span style="font-size: 11px; font-weight: 900; letter-spacing: -0.02em;">${badgeText}</span>
          ${isPlus ? `<span class="flex items-center justify-center text-amber-200">${CROWN_SVG}</span>` : ""}
        </div>
      `;

      const icon = L.divIcon({
        className: "esnaf-map-marker",
        html: markerHtml,
        iconSize: [84, 32],
        iconAnchor: [42, 16],
      });

      const marker = L.marker([lat, lng], { icon });

      const popupHtml = `
        <div style="padding: 10px 12px; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif; min-width: 190px;">
          <h4 style="font-weight: 800; font-size: 13px; margin: 0 0 2px 0; color: #111827;">${m.name}</h4>
          <p style="font-size: 11px; color: #6B7280; margin: 0 0 8px 0;">${m.masterName} · ${m.minPrice} ₺ - ${m.maxPrice} ₺</p>
          <a href="/esnaf/${m.slug}" style="display: block; text-align: center; padding: 6px 12px; background: #E05A36; color: #ffffff; border-radius: 9999px; font-weight: 800; font-size: 11px; text-decoration: none;">
            Profili İncele & Randevu Al
          </a>
        </div>
      `;
      marker.bindPopup(popupHtml, { className: "esnaf-leaflet-popup", closeButton: true });

      marker.on("click", () => {
        setActiveMerchant(m);
        map.panTo([lat, lng], { animate: true, duration: 0.4 });
        if (onSelectMerchant) onSelectMerchant(m);
      });

      group.addLayer(marker);
    });

    if (searchQuery.trim() && filteredMerchantsWithDistance.length > 0) {
      const coords = filteredMerchantsWithDistance.map((m) => m.coords);
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
    }
  }, [filteredMerchantsWithDistance, activeMerchant, searchQuery, userLocation, onSelectMerchant]);

  // 4. Process real coordinates
  const processLocationCoordinates = useCallback(async (latitude: number, longitude: number) => {
    isGpsLocatingRef.current = true;
    setUserLocation([latitude, longitude]);

    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo([latitude, longitude], 15, { duration: 1.2 });

      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([latitude, longitude]);
      } else {
        const userDot = L.divIcon({
          className: "user-gps-dot",
          html: `
            <div class="relative flex items-center justify-center w-8 h-8">
              <div class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-60"></div>
              <div class="relative inline-flex rounded-full h-4 w-4 bg-blue-600 border-2 border-white shadow-xl"></div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
        userMarkerRef.current = L.marker([latitude, longitude], { icon: userDot, zIndexOffset: 1000 }).addTo(map);
      }
    }

    try {
      const res = await fetch(`/api/locate?lat=${latitude}&lon=${longitude}`);
      const data = await res.json();
      setIsLocating(false);

      if (data && data.success && data.city) {
        // If the neighborhood has merchants, filter by it; otherwise keep district scope so nearby pins stay visible
        const hasMerchantsInNh = data.neighborhood ? merchants.some(
          m => m.city === data.city && m.district === data.district && m.neighborhood === data.neighborhood
        ) : false;

        if (onSelectLocation) {
          onSelectLocation(data.city, data.district || "Tüm Bölgeler", hasMerchantsInNh ? data.neighborhood : "");
        }
      }
    } catch {
      setIsLocating(false);
    } finally {
      setTimeout(() => {
        isGpsLocatingRef.current = false;
      }, 2000);
    }
  }, [merchants, onSelectLocation]);

  // 5. GPS Trigger (Attempts real hardware GPS)
  const handleLocateMe = useCallback(() => {
    setIsLocating(true);

    if (typeof window === "undefined" || !navigator.geolocation) {
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        processLocationCoordinates(latitude, longitude);
      },
      (err) => {
        console.warn("Geolocation unavailable:", err);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }, [processLocationCoordinates]);

  const handleSelectMerchantCard = (m: any) => {
    setActiveMerchant(m);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo(m.coords, { animate: true, duration: 0.5 });
    }
    if (onSelectMerchant) onSelectMerchant(m);
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  return (
    <div className="relative w-full h-[calc(100dvh-3.5rem)] sm:h-[calc(100dvh-4rem)] overflow-hidden bg-zinc-100 dark:bg-black flex flex-col">
      {/* 1. Leaflet Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* 2. Floating Top Search & Quick Filters Card */}
      <div className="absolute top-3 left-3 right-3 sm:left-6 sm:right-auto sm:w-[520px] z-[9999] space-y-2 pointer-events-auto">
        <div className="bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-xl rounded-3xl border border-black/[0.08] dark:border-white/[0.12] p-3 sm:p-3.5 shadow-2xl space-y-2.5 transition-all">
          {/* Search Bar */}
          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1 flex items-center">
              <Search className="absolute left-3.5 w-4 h-4 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
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

            {/* Blue Search Action Button */}
            <button
              type="button"
              className="px-3.5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-extrabold shadow-sm transition-all ios-press shrink-0"
            >
              Ara
            </button>

            {/* GPS Direct Locate Button */}
            <button
              type="button"
              onClick={handleLocateMe}
              disabled={isLocating}
              title="Konumumu Bul (GPS)"
              className={`p-2.5 rounded-2xl border transition-all ios-press shrink-0 flex items-center justify-center ${
                isLocating
                  ? "bg-blue-50 dark:bg-blue-950/60 border-blue-400 text-blue-600 shadow-sm"
                  : "bg-zinc-100 dark:bg-zinc-800 border-black/[0.04] dark:border-white/[0.08] text-zinc-700 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              {isLocating ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              ) : (
                <Crosshair className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Quick Filter Chips with Lucide Icons */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 pt-0.5">
            <button
              type="button"
              onClick={() => setOnlyOpen(!onlyOpen)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5 ios-press ${
                onlyOpen
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Açık Olanlar</span>
            </button>

            <button
              type="button"
              onClick={() => setOnlyVerified(!onlyVerified)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5 ios-press ${
                onlyVerified
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Doğrulanmış</span>
            </button>

            <button
              type="button"
              onClick={() => setOnlyPlus(!onlyPlus)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5 ios-press ${
                onlyPlus
                  ? "bg-amber-500 text-white shadow-xs"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              <span>Plus Usta</span>
            </button>

            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const Icon = CATEGORY_ICON_MAP[cat.id] || Sparkles;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(isSelected ? "all" : (cat.id as CategoryId))}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5 ios-press ${
                    isSelected
                      ? "bg-brand text-white shadow-xs"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 stroke-[2]" />
                  <span>{cat.name.split("&")[0].trim()}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Floating Zoom Controls */}
      <div className="absolute right-4 top-20 z-[9999] hidden sm:flex flex-col gap-1.5 pointer-events-auto">
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

      {/* ======================================================== */}
      {/* 5. EXPANDABLE BOTTOM SHEET & NEAREST LIST                */}
      {/* ======================================================== */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-[9999] transition-all duration-300 pointer-events-auto flex flex-col bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-xl border-t border-black/[0.08] dark:border-white/[0.1] shadow-2xl rounded-t-3xl ${
          isDrawerExpanded ? "h-[55vh] sm:h-[45vh]" : "h-[220px] sm:h-[165px]"
        }`}
      >
        {/* Pull Grabber Header */}
        <div
          onClick={() => setIsDrawerExpanded(!isDrawerExpanded)}
          className="pt-2 pb-1.5 px-4 flex flex-col items-center cursor-pointer select-none hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors shrink-0"
        >
          <div className="w-10 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mb-1.5" />
          
          <div className="w-full flex items-center justify-between gap-2">
            <span className="text-xs font-black text-zinc-500 dark:text-zinc-400">
              {filteredMerchantsWithDistance.length} Usta
            </span>

            {/* Sorting Switcher Pill with Lucide Icons */}
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSortBy("nearest");
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                  sortBy === "nearest"
                    ? "bg-white dark:bg-zinc-700 text-black dark:text-white shadow-xs"
                    : "text-zinc-500 hover:text-black dark:hover:text-white"
                }`}
              >
                <Navigation className="w-2.5 h-2.5 text-blue-500" />
                <span>En Yakın</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSortBy("rating");
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                  sortBy === "rating"
                    ? "bg-white dark:bg-zinc-700 text-black dark:text-white shadow-xs"
                    : "text-zinc-500 hover:text-black dark:hover:text-white"
                }`}
              >
                <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-400" />
                <span>Puan</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSortBy("price");
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                  sortBy === "price"
                    ? "bg-white dark:bg-zinc-700 text-black dark:text-white shadow-xs"
                    : "text-zinc-500 hover:text-black dark:hover:text-white"
                }`}
              >
                <CircleDollarSign className="w-2.5 h-2.5 text-emerald-500" />
                <span>Fiyat</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDrawerExpanded(!isDrawerExpanded)}
                className="p-1 text-zinc-400 hover:text-black dark:hover:text-white ml-0.5"
              >
                {isDrawerExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Nearest Merchants List with Momentum Touch Scrolling */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-32 divide-y divide-black/[0.04] dark:divide-white/[0.06] touch-pan-y">
          {filteredMerchantsWithDistance.length > 0 ? (
            filteredMerchantsWithDistance.map((m) => {
              const isSelected = activeMerchant?.id === m.id;
              const Icon = CATEGORY_ICON_MAP[m.category] || Sparkles;

              return (
                <div
                  key={m.id}
                  onClick={() => handleSelectMerchantCard(m)}
                  className={`py-3 px-2.5 flex items-center justify-between gap-3 cursor-pointer group transition-all rounded-2xl ${
                    isSelected
                      ? "bg-blue-50/80 dark:bg-blue-950/40 ring-1 ring-blue-500/30"
                      : "hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                  }`}
                >
                  {/* Leading: Apple-style Squircle Icon */}
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                    m.tier === "plus"
                      ? "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40"
                      : "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40"
                  }`}>
                    <Icon className="w-5 h-5 stroke-[2]" />
                  </div>

                  {/* Middle: Apple 3-tier Text Stack */}
                  <div className="space-y-0.5 flex-1 min-w-0">
                    {/* Primary: Title + Plus Badge */}
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Link
                        href={`/esnaf/${m.slug}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-bold text-xs sm:text-sm text-black dark:text-white truncate hover:text-brand dark:hover:text-brand transition-colors"
                      >
                        {m.name}
                      </Link>
                      {m.tier === "plus" && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-extrabold flex items-center gap-0.5 shrink-0">
                          <Crown className="w-2.5 h-2.5 fill-current" /> Plus
                        </span>
                      )}
                    </div>

                    {/* Secondary: Master & Transparent Price */}
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                      {m.masterName} · <span className="font-semibold text-zinc-700 dark:text-zinc-300">{m.minPrice} ₺ - {m.maxPrice} ₺</span>
                    </p>

                    {/* Tertiary: Clean 1-Line Metadata (Rating · Distance · Walk · Open Status) */}
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 dark:text-zinc-500 whitespace-nowrap overflow-hidden">
                      <span className="flex items-center gap-0.5 font-bold text-amber-500 dark:text-amber-400">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {m.rating}
                      </span>
                      <span>·</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-0.5">
                        <Navigation className="w-2.5 h-2.5" />
                        {m.distanceLabel}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-0.5">
                        <Footprints className="w-2.5 h-2.5" />
                        {m.walkTimeLabel}
                      </span>
                      <span>·</span>
                      <span className={m.isOpenNow ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-zinc-400"}>
                        {m.isOpenNow ? "Açık" : "Kapalı"}
                      </span>
                    </div>
                  </div>

                  {/* Trailing Actions: Profile Link & WhatsApp */}
                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Link
                      href={`/esnaf/${m.slug}`}
                      className="px-3 py-1.5 rounded-full bg-brand hover:bg-brand-hover text-white text-[10px] sm:text-xs font-extrabold transition-all ios-press shrink-0 flex items-center gap-0.5 shadow-xs"
                      title="Profili İncele & Randevu Al"
                    >
                      <span>İncele</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>

                    <a
                      href={generateWhatsAppUrl(m)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400 text-[10px] sm:text-xs font-extrabold transition-all ios-press shrink-0 flex items-center justify-center border border-emerald-500/20"
                      title="WhatsApp'tan Yaz"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-xs text-zinc-400">
              Bu bölgede eşleşen usta bulunamadı.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
