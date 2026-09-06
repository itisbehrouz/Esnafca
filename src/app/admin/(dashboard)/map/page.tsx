"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  MapPin,
  AlertTriangle,
  Filter,
} from "lucide-react";
import { getAdminMapCoverageData } from "@/app/actions/admin";
import { CATEGORIES } from "@/data/categories";
import { LOCATION_COORDINATES } from "@/data/coordinates";

function resolveMerchantCoordinates(m: any): { lat: number; lon: number; isEstimated: boolean } {
  if (
    typeof m.latitude === "number" &&
    typeof m.longitude === "number" &&
    !isNaN(m.latitude) &&
    !isNaN(m.longitude) &&
    m.latitude !== 0 &&
    m.longitude !== 0
  ) {
    return { lat: m.latitude, lon: m.longitude, isEstimated: false };
  }

  const nKey = (m.neighborhood || "").toLowerCase().trim();
  const dKey = (m.district || "").toLowerCase().trim();

  if (nKey && LOCATION_COORDINATES[nKey]) {
    const coords = LOCATION_COORDINATES[nKey];
    return { lat: coords[0], lon: coords[1], isEstimated: true };
  }

  if (dKey && LOCATION_COORDINATES[dKey]) {
    const coords = LOCATION_COORDINATES[dKey];
    return { lat: coords[0], lon: coords[1], isEstimated: true };
  }

  return { lat: 41.0428, lon: 29.0077, isEstimated: true };
}

export default function AdminMapCoveragePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDistrict, setSelectedDistrict] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"map" | "grid">("map");
  const [showSupplyGaps, setShowSupplyGaps] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await getAdminMapCoverageData();
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const merchants = data?.merchants || [];
  const districtStats = data?.districtStats || {};
  const supplyGaps = data?.supplyGaps || [];

  // Filtered merchants
  const filteredMerchants = merchants.filter((m: any) => {
    if (selectedDistrict !== "all" && m.district !== selectedDistrict) return false;
    if (selectedCategory !== "all" && m.category !== selectedCategory) return false;
    return true;
  });

  // Initialize and update Leaflet map client-side
  useEffect(() => {
    if (viewMode !== "map" || !mapContainerRef.current || typeof window === "undefined") return;

    let isMounted = true;

    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [41.0428, 29.0077], // Istanbul Center
          zoom: 12,
          zoomControl: true,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        const markersGroup = L.featureGroup().addTo(map);
        mapInstanceRef.current = map;
        markersGroupRef.current = markersGroup;
      }

      const map = mapInstanceRef.current;
      const group = markersGroupRef.current;
      if (!map || !group) return;

      group.clearLayers();

      const validCoords: [number, number][] = [];

      filteredMerchants.forEach((m: any) => {
        const { lat, lon, isEstimated } = resolveMerchantCoordinates(m);
        validCoords.push([lat, lon]);

        const isPlus = m.tier === "plus";
        const color = isPlus ? "#F59E0B" : "#2563EB";

        const iconHtml = `
          <div style="background:${color}; color:white; border-radius:9999px; padding:4px 8px; font-weight:800; font-size:10px; font-family:sans-serif; border:2px solid white; box-shadow:0 4px 6px -1px rgba(0,0,0,0.2); display:flex; items-center; gap:4px; white-space:nowrap;">
            <span>${m.name.slice(0, 14)}...</span>
          </div>
        `;

        const customIcon = L.divIcon({
          className: "admin-map-pin",
          html: iconHtml,
          iconSize: [90, 24],
          iconAnchor: [45, 12],
        });

        const marker = L.marker([lat, lon], { icon: customIcon });

        const popupContent = `
          <div style="font-family:sans-serif; padding:6px; min-width:160px;">
            <strong style="display:block; font-size:12px; margin-bottom:2px;">${m.name}</strong>
            <span style="font-size:10px; color:#64748B;">${m.masterName} · ${m.district}</span>
            ${
              isEstimated
                ? `<span style="display:block; font-size:9px; color:#D97706; font-weight:bold; margin-top:2px;">📍 Mahalle/İlçe Yaklaşık Konumu</span>`
                : ""
            }
            <div style="margin-top:6px; font-size:10px; font-weight:bold; color:#2563EB;">
              ${m.category.toUpperCase()} · Paket: ${(m.tier || "pro").toUpperCase()}
            </div>
            <a href="/admin/merchants/${m.id}" style="display:inline-block; margin-top:6px; font-size:10px; font-weight:bold; color:#2563EB; text-decoration:underline;">
              Esnafı Düzenle ↗
            </a>
          </div>
        `;

        marker.bindPopup(popupContent);
        group.addLayer(marker);
      });

      if (validCoords.length > 0) {
        try {
          map.fitBounds(L.latLngBounds(validCoords), { padding: [50, 50], maxZoom: 14 });
        } catch {}
      }
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersGroupRef.current = null;
      }
    };
  }, [viewMode, filteredMerchants]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-xs font-mono text-slate-400">
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
        <span>Kapsama Haritası ve Bölge Yoğunluk Telemetrisi Hesaplanıyor...</span>
      </div>
    );
  }

  const districtsList = Object.keys(districtStats).sort();

  return (
    <div className="space-y-6 font-sans select-none pb-16">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Mahalle Zanaatkar Kapsama Haritası
            </h1>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
              Arz & Talep Telemetrisi
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            İlçe ve mahalle bazında zanaatkar yoğunluğu, kritik arz boşlukları ve saha büyüme fırsatları.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {supplyGaps.length > 0 && (
            <button
              type="button"
              onClick={() => setShowSupplyGaps(!showSupplyGaps)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                showSupplyGaps
                  ? "bg-amber-500 text-white shadow-xs"
                  : "bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{supplyGaps.length} Kritik Boşluk</span>
              <span className="text-[10px] ml-0.5">{showSupplyGaps ? "▲" : "▼"}</span>
            </button>
          )}

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode("map")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "map"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Harita Görünümü
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Yoğunluk Matrisi
            </button>
          </div>
        </div>
      </div>

      {/* Collapsible Supply Gaps Alert Section */}
      {showSupplyGaps && supplyGaps.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                Kritik Arz Boşlukları & Saha Büyüme Fırsatları ({supplyGaps.length} Bölge Uyarısı)
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowSupplyGaps(false)}
              className="text-xs font-bold text-amber-700 dark:text-amber-300 hover:underline cursor-pointer"
            >
              Gizle ✕
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto">
            {supplyGaps.map((gap: any, idx: number) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-white dark:bg-[#0B1120] border border-amber-500/20 text-xs space-y-1 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-900 dark:text-white">
                    {gap.district}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded uppercase ${
                      gap.severity === "HIGH"
                        ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                        : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {gap.currentCount} {gap.category.toUpperCase()}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {gap.recommendation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Controls Bar */}
      <div className="p-3 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtre:</span>
          </span>

          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="p-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 text-xs font-bold focus:outline-none"
          >
            <option value="all">Tüm İlçeler ({districtsList.length})</option>
            {districtsList.map((dist) => (
              <option key={dist} value={dist}>
                {dist} ({districtStats[dist]?.total} Esnaf)
              </option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="p-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 text-xs font-bold focus:outline-none"
          >
            <option value="all">Tüm Kategoriler ({CATEGORIES.length})</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-400 font-mono tabular-nums">
          Ekranda: <strong className="text-slate-900 dark:text-white font-bold">{filteredMerchants.length}</strong> Esnaf
        </div>
      </div>

      {/* Main View: Leaflet Map or Grid Matrix */}
      {viewMode === "map" ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs h-[calc(100vh-230px)] min-h-[620px] relative">
          <div ref={mapContainerRef} className="w-full h-full z-10" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {districtsList.map((dist) => {
              const stats = districtStats[dist];
              const total = stats?.total || 0;
              const catsCount = Object.keys(stats?.categories || {}).length;
              const coverageRate = Math.min(100, Math.round((catsCount / 6) * 100));

              return (
                <div
                  key={dist}
                  className="p-4 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                        {dist}
                      </h3>
                      <span className="text-[11px] text-slate-500 block">
                        {total} Kayıtlı Mahalle Esnafı
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        coverageRate >= 70
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : coverageRate >= 40
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      %{coverageRate} Kapsama
                    </span>
                  </div>

                  {/* Category Pills Breakdown */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {Object.entries(stats?.categories || {}).map(([cat, count]: any) => (
                      <span
                        key={cat}
                        className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-[10px] font-bold"
                      >
                        {cat}: {count}
                      </span>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>Doğrulanmış: {stats?.verifiedCount}</span>
                    <span>Ücretli (Pro/Plus): {stats?.paidCount}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
