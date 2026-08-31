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

export const DISTRICT_COORDINATES: Record<string, [number, number]> = {
  // İstanbul - Kağıthane & Eyüp & Şişli & Beşiktaş & Kadıköy
  "Nurtepe": [41.0775, 28.9665],
  "Güzeltepe": [41.0720, 28.9550],
  "Kağıthane": [41.0820, 28.9730],
  "Gültepe": [41.0780, 28.9950],
  "Ortabayır": [41.0780, 28.9950],
  "Çeliktepe": [41.0850, 29.0020],
  "Sanayi": [41.0920, 28.9910],
  "Seyrantepe": [41.1000, 28.9950],
  "Hamidiye": [41.0960, 28.9680],
  "Emniyetevleri": [41.0880, 29.0050],
  "Alibeyköy": [41.0680, 28.9520],
  "Eyüpsultan": [41.0480, 28.9340],
  "Şişli": [41.0585, 28.9810],
  "Bomonti": [41.0585, 28.9810],
  "Mecidiyeköy": [41.0660, 28.9930],
  "Nişantaşı": [41.0520, 28.9920],
  "Levent": [41.0820, 29.0140],
  "Beşiktaş": [41.0425, 29.0065],
  "Akaretler": [41.0410, 28.9995],
  "Sinanpaşa": [41.0425, 29.0065],
  "Gayrettepe": [41.0665, 29.0125],
  "Kadıköy": [40.9910, 29.0295],
  "Moda": [40.9855, 29.0270],
  "Caferağa": [40.9855, 29.0270],
  "Osmanağa": [40.9910, 29.0295],
  "Rasimpaşa": [40.9950, 29.0300],
  "Üsküdar": [41.0260, 29.0150],
  "Kuzguncuk": [41.0360, 29.0280],
  "Bakırköy": [40.9780, 28.8730],
  "Beyoğlu": [41.0370, 28.9770],
  "Cihangir": [41.0330, 28.9830],
  "Sarıyer": [41.1667, 29.0500],
  "Maslak": [41.1100, 29.0200],
  "İstanbul": [41.0775, 28.9665],

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

  // Bursa & Antalya & Eskişehir
  "Bursa": [40.1885, 29.0610],
  "Nilüfer": [40.2150, 28.9850],
  "Antalya": [36.8969, 30.7133],
  "Muratpaşa": [36.8850, 30.7080],
  "Eskişehir": [39.7767, 30.5206],
};

const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  "berber-kuafor": Scissors,
  "terzi-lostra": Scissors,
  "oto-bakim": Car,
  "acil-ev": KeyRound,
  "veteriner": Dog,
  "pet-kuafor": Dog,
  "tamir-elektronik": Hammer,
  "atolye-tamir": Hammer,
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

// Precise Haversine distance calculator
function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

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

function getMerchantCoordinates(m: Merchant): [number, number] {
  if (m.coordinates) return [m.coordinates.lat, m.coordinates.lng];
  const text = `${m.neighborhood} ${m.district} ${m.city} ${m.address}`.toLowerCase();
  
  for (const [key, coords] of Object.entries(DISTRICT_COORDINATES)) {
    if (text.includes(key.toLowerCase())) return coords;
  }

  return [41.0775, 28.9665];
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
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "info" | "warning" } | null>(null);

  const showToast = useCallback((text: string, type: "success" | "info" | "warning" = "info") => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage({ text, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

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

    let targetCoords: [number, number] | null = null;
    let zoomLevel = 14;

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
        if (onSelectLocation) {
          onSelectLocation(data.city, data.district || "Tüm Bölgeler", data.neighborhood || "");
        }
        const locLabel = [data.neighborhood, data.district, data.city].filter(Boolean).join(", ");
        showToast(`Konumunuz tespit edildi: ${locLabel}`, "success");
      } else {
        showToast("Konumunuz haritada işaretlendi.", "success");
      }
    } catch {
      setIsLocating(false);
      showToast("Konumunuz haritada işaretlendi.", "success");
    }
  }, [onSelectLocation, showToast]);

  // 5. GPS Trigger
  const handleLocateMe = useCallback(() => {
    setIsLocating(true);
    showToast("Mevcut konumunuz alınıyor...", "info");

    if (typeof window === "undefined" || !navigator.geolocation) {
      fetch("/api/locate?auto=1")
        .then(r => r.json())
        .then(data => {
          if (data?.lat && data?.lon) processLocationCoordinates(data.lat, data.lon);
        })
        .finally(() => setIsLocating(false));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        processLocationCoordinates(latitude, longitude);
      },
      async (err) => {
        try {
          const res = await fetch("/api/locate?auto=1");
          const ipData = await res.json();
          if (ipData && ipData.lat && ipData.lon) {
            processLocationCoordinates(ipData.lat, ipData.lon);
            return;
          }
        } catch {
          // ignore
        }

        setIsLocating(false);
        if (err.code === 1) {
          showToast("Konum izni verilmedi. Tarayıcı izinlerinden aktif edebilir veya listeden seçebilirsiniz.", "warning");
        } else {
          showToast("Konum bilgisi alınamadı. Lütfen konum butonundan il/ilçe seçin.", "warning");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [processLocationCoordinates, showToast]);

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

      {/* 2. Floating Toast Notification */}
      {toastMessage && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 pointer-events-none animate-in fade-in slide-in-from-top-2 duration-200">
          <div
            className={`px-4 py-2 rounded-full backdrop-blur-md shadow-xl border text-xs font-extrabold flex items-center gap-2 ${
              toastMessage.type === "success"
                ? "bg-emerald-600/95 text-white border-emerald-400/40 shadow-emerald-950/20"
                : toastMessage.type === "warning"
                ? "bg-amber-600/95 text-white border-amber-300/40 shadow-amber-950/20"
                : "bg-black/90 dark:bg-white/95 text-white dark:text-black border-white/10 dark:border-black/10"
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* 3. Floating Top Search & Quick Filters Card */}
      <div className="absolute top-3 left-3 right-3 sm:left-6 sm:right-auto sm:w-[520px] z-30 space-y-2 pointer-events-auto">
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

      {/* ======================================================== */}
      {/* 5. EXPANDABLE BOTTOM SHEET & NEAREST LIST                */}
      {/* ======================================================== */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-30 transition-all duration-300 pointer-events-auto flex flex-col bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-xl border-t border-black/[0.08] dark:border-white/[0.1] shadow-2xl rounded-t-3xl ${
          isDrawerExpanded ? "h-[45vh]" : "h-[165px]"
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
                      <h4 className="font-bold text-xs sm:text-sm text-black dark:text-white truncate">
                        {m.name}
                      </h4>
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

                  {/* Trailing Action: Apple WhatsApp Button */}
                  <a
                    href={generateWhatsAppUrl(m)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="w-10 h-10 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white transition-all shadow-xs flex items-center justify-center ios-press shrink-0"
                    title="WhatsApp'tan Yaz"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm5.79 14.07c-.24.68-1.4 1.29-1.93 1.37-.51.08-1.18.11-1.9-.12-.44-.14-1.01-.33-1.74-.65-3.07-1.33-5.07-4.43-5.22-4.64-.15-.2-1.24-1.65-1.24-3.15 0-1.5.78-2.24 1.06-2.54.28-.3.61-.37.81-.37.2 0 .41 0 .59.01.19.01.44-.07.69.52.25.6.86 2.1.94 2.25.08.15.13.33.03.53-.1.2-.15.33-.3.51-.15.18-.32.4-.46.54-.15.15-.31.31-.13.62.18.31.8 1.32 1.72 2.14 1.18 1.05 2.17 1.38 2.48 1.53.31.15.49.13.67-.08.18-.21.78-.91.99-1.22.21-.31.42-.26.71-.15.29.11 1.83.86 2.14 1.01.31.15.52.23.6.36.08.13.08.76-.16 1.44z" />
                    </svg>
                  </a>
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
