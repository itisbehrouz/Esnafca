import { NextResponse } from "next/server";
import { CITIES } from "@/data/cities";

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
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json(
      { success: false, error: "Koordinat bilgisi (lat, lon) zorunludur." },
      { status: 400 }
    );
  }

  try {
    // Reverse Geocode using OpenStreetMap Nominatim with proper headers
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=tr`,
      {
        headers: {
          "User-Agent": "EsnafcaApp/1.0 (info@esnafca.com)",
        },
      }
    );
    const data = await res.json();

    if (!data || !data.address) {
      return NextResponse.json(
        { success: false, error: "Adres bulunamadı." },
        { status: 404 }
      );
    }

    const addr = data.address;
    const detectedCity = addr.province || addr.city || addr.state || "";
    const detectedDistrict = addr.town || addr.city_district || addr.district || addr.suburb || addr.county || addr.borough || "";
    const detectedNeighborhood = addr.suburb || addr.neighbourhood || addr.quarter || addr.village || "";
    const detectedRoad = addr.road || addr.street || "";
    const houseNumber = addr.house_number ? ` No: ${addr.house_number}` : "";

    const normCity = normalizeTr(detectedCity);
    const normDistrict = normalizeTr(detectedDistrict);
    const normNeighborhood = normalizeTr(detectedNeighborhood);

    let matchedCityName = "";
    let matchedDistrictName = "";
    let matchedNeighborhoodName = "";

    // 1. Find matching city in CITIES
    const cityObj = CITIES.find((c) => {
      const cNorm = normalizeTr(c.name);
      return normCity.includes(cNorm) || cNorm.includes(normCity);
    }) || CITIES[0]; // fallback to Istanbul if in TR

    matchedCityName = cityObj.name;

    // 2. Find matching district in City's districts
    const distObj = cityObj.districts.find((d) => {
      const dNorm = normalizeTr(d.name);
      return (
        normDistrict.includes(dNorm) ||
        dNorm.includes(normDistrict) ||
        normNeighborhood.includes(dNorm) ||
        normalizeTr(data.display_name || "").includes(dNorm)
      );
    });

    if (distObj) {
      matchedDistrictName = distObj.name;

      // 3. Find matching neighborhood
      if (distObj.neighborhoods.length > 0) {
        const foundNh = distObj.neighborhoods.find((nh) => {
          const nhNorm = normalizeTr(nh);
          return (
            normNeighborhood.includes(nhNorm) ||
            nhNorm.includes(normNeighborhood) ||
            normalizeTr(detectedRoad).includes(nhNorm) ||
            normalizeTr(data.display_name || "").includes(nhNorm)
          );
        });

        matchedNeighborhoodName = foundNh || distObj.neighborhoods[0];
      }
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
      raw: addr,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Konum servisine ulaşılamadı." },
      { status: 500 }
    );
  }
}
