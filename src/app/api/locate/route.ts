import { NextResponse } from "next/server";
import { CITIES } from "@/data/cities";
import { findNearestDistrictAndCity, getDistanceInMeters, LOCATION_COORDINATES } from "@/data/coordinates";

// Turkish normalization helper for accurate district/neighborhood matching
function normalizeTr(text: string): string {
  return text
    .toLowerCase()
    .replace(/â/g, "a")
    .replace(/î/g, "i")
    .replace(/û/g, "u")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/mahallesi|mah\.|mah/g, "")
    .trim();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let lat = searchParams.get("lat");
  let lon = searchParams.get("lon");
  const auto = searchParams.get("auto");

  let detectedCityFromIp = "";
  let detectedRegionFromIp = "";

  // If lat/lon not provided or auto=1 requested, perform fast IP Geolocation lookup
  if ((!lat || !lon) || (auto === "1" || auto === "true")) {
    try {
      const clientIp =
        request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
        request.headers.get("x-real-ip") ||
        "";

      const ipQuery =
        clientIp &&
        !clientIp.startsWith("127.") &&
        !clientIp.startsWith("192.168.") &&
        !clientIp.startsWith("10.") &&
        clientIp !== "::1"
          ? clientIp
          : "";

      const ipRes = await fetch(
        `http://ip-api.com/json/${ipQuery}?fields=status,country,regionName,city,lat,lon`,
        { signal: AbortSignal.timeout(3000) }
      );
      const ipData = await ipRes.json();
      if (ipData && ipData.status === "success" && ipData.lat && ipData.lon) {
        if (!lat) lat = String(ipData.lat);
        if (!lon) lon = String(ipData.lon);
        detectedCityFromIp = ipData.city || "";
        detectedRegionFromIp = ipData.regionName || "";
      }
    } catch {
      // IP lookup fallback default
      if (!lat) lat = "41.0775";
      if (!lon) lon = "28.9665";
    }
  }

  if (!lat || !lon) {
    lat = "41.0775";
    lon = "28.9665";
  }

  const parsedLat = parseFloat(lat);
  const parsedLon = parseFloat(lon);

  // 1. Try Reverse Geocoding with OSM Nominatim
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=tr`,
      {
        headers: {
          "User-Agent": "EsnafcaApp/1.0 (info@esnafca.com)",
        },
        signal: AbortSignal.timeout(3500),
      }
    );
    const data = await res.json();

    if (data && data.address) {
      const addr = data.address;
      const detectedCity = addr.province || addr.city || addr.state || detectedCityFromIp || "";
      const detectedDistrict = addr.town || addr.city_district || addr.district || addr.suburb || addr.county || addr.borough || "";
      const detectedNeighborhood = addr.suburb || addr.neighbourhood || addr.quarter || addr.village || "";
      const detectedRoad = addr.road || addr.street || "";
      const houseNumber = addr.house_number ? ` No: ${addr.house_number}` : "";

      const normCity = normalizeTr(detectedCity);
      const normDistrict = normalizeTr(detectedDistrict);
      const normNeighborhood = normalizeTr(detectedNeighborhood);
      const normDisplay = normalizeTr(data.display_name || "");

      let matchedCityName = "";
      let matchedDistrictName = "";
      let matchedNeighborhoodName = "";

      // Find matching city in CITIES
      let cityObj = CITIES.find((c) => {
        const cNorm = normalizeTr(c.name);
        return normCity.includes(cNorm) || cNorm.includes(normCity) || normDisplay.includes(cNorm);
      });

      if (!cityObj) {
        for (const c of CITIES) {
          const hasDist = c.districts.some((d) => {
            const dNorm = normalizeTr(d.name);
            return normDistrict.includes(dNorm) || dNorm.includes(normDistrict) || normNeighborhood.includes(dNorm);
          });
          if (hasDist) {
            cityObj = c;
            break;
          }
        }
      }

      if (!cityObj) {
        cityObj = CITIES.find(c => c.name === "İstanbul") || CITIES[0];
      }

      matchedCityName = cityObj.name;

      // Find matching district in City's districts
      const distObj = cityObj.districts.find((d) => {
        const dNorm = normalizeTr(d.name);
        return (
          normDistrict.includes(dNorm) ||
          dNorm.includes(normDistrict) ||
          normNeighborhood.includes(dNorm) ||
          normDisplay.includes(dNorm)
        );
      });

      if (distObj) {
        matchedDistrictName = distObj.name;

        if (distObj.neighborhoods.length > 0) {
          const foundNh = distObj.neighborhoods.find((nh) => {
            const nhNorm = normalizeTr(nh);
            return (
              normNeighborhood.includes(nhNorm) ||
              nhNorm.includes(normNeighborhood) ||
              normalizeTr(detectedRoad).includes(nhNorm) ||
              normDisplay.includes(nhNorm)
            );
          });

          matchedNeighborhoodName = foundNh || distObj.neighborhoods[0];
        }
      } else if (cityObj.districts.length > 0) {
        matchedDistrictName = cityObj.districts[0].name;
        matchedNeighborhoodName = cityObj.districts[0].neighborhoods[0] || "";
      }

      const finalAddress = detectedRoad
        ? `${detectedRoad}${houseNumber}`
        : `${matchedNeighborhoodName || ""}, ${matchedDistrictName || ""} / ${matchedCityName || ""}`.trim();

      return NextResponse.json({
        success: true,
        city: matchedCityName,
        district: matchedDistrictName,
        neighborhood: matchedNeighborhoodName,
        address: finalAddress,
        lat: parsedLat,
        lon: parsedLon,
        source: "osm",
      });
    }
  } catch {
    // Nominatim timed out or failed, fall back to high-accuracy nearest coordinate lookup
  }

  // 2. High-Accuracy Mathematical Distance Matching Fallback
  const nearest = findNearestDistrictAndCity(parsedLat, parsedLon);
  const normalizedKey = normalizeTr(nearest.key);

  let fallbackCityName = "İstanbul";
  let fallbackDistrictName = "Kağıthane";
  let fallbackNhName = "Nurtepe";

  for (const c of CITIES) {
    const cNorm = normalizeTr(c.name);
    if (normalizedKey.includes(cNorm) || cNorm.includes(normalizedKey)) {
      fallbackCityName = c.name;
    }
    for (const d of c.districts) {
      const dNorm = normalizeTr(d.name);
      if (normalizedKey.includes(dNorm) || dNorm.includes(normalizedKey)) {
        fallbackCityName = c.name;
        fallbackDistrictName = d.name;
        fallbackNhName = d.neighborhoods[0] || "";
        break;
      }
      for (const nh of d.neighborhoods) {
        const nhNorm = normalizeTr(nh);
        if (normalizedKey.includes(nhNorm) || nhNorm.includes(normalizedKey)) {
          fallbackCityName = c.name;
          fallbackDistrictName = d.name;
          fallbackNhName = nh;
          break;
        }
      }
    }
  }

  return NextResponse.json({
    success: true,
    city: fallbackCityName,
    district: fallbackDistrictName,
    neighborhood: fallbackNhName,
    address: `${fallbackNhName}, ${fallbackDistrictName} / ${fallbackCityName}`,
    lat: parsedLat,
    lon: parsedLon,
    source: "geo_nearest",
  });
}
