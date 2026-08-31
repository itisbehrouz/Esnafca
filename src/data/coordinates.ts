import { Merchant } from "@/types";

export const LOCATION_COORDINATES: Record<string, [number, number]> = {
  // ==========================================
  // 1. İSTANBUL - Avrupa & Anadolu
  // ==========================================
  // Kağıthane
  "nurtepe": [41.0775, 28.9665],
  "güzeltepe": [41.0720, 28.9550],
  "kağıthane": [41.0820, 28.9730],
  "gültepe": [41.0780, 28.9950],
  "ortabayır": [41.0780, 28.9950],
  "çeliktepe": [41.0850, 29.0020],
  "sanayi": [41.0920, 28.9910],
  "seyrantepe": [41.1000, 28.9950],
  "hamidiye": [41.0960, 28.9680],
  "emniyetevleri": [41.0880, 29.0050],
  "şirintepe": [41.0890, 28.9980],
  "çağlayan": [41.0720, 28.9800],
  "gürsel": [41.0700, 28.9730],

  // Eyüpsultan
  "alibeyköy": [41.0680, 28.9520],
  "eyüpsultan": [41.0480, 28.9340],
  "eyüp": [41.0480, 28.9340],
  "göktürk": [41.1820, 28.8950],
  "kemerburgaz": [41.1650, 28.9150],
  "yeşilpınar": [41.0760, 28.9320],
  "rami": [41.0450, 28.9150],

  // Şişli
  "şişli": [41.0585, 28.9810],
  "bomonti": [41.0585, 28.9810],
  "mecidiyeköy": [41.0660, 28.9930],
  "nişantaşı": [41.0520, 28.9920],
  "teşvikiye": [41.0510, 28.9940],
  "kurtuluş": [41.0500, 28.9830],
  "fulya": [41.0570, 28.9990],
  "esentepe": [41.0710, 29.0080],
  "feriköy": [41.0530, 28.9780],
  "harbiye": [41.0470, 28.9890],
  "kuştepe": [41.0690, 28.9910],

  // Beşiktaş
  "beşiktaş": [41.0425, 29.0065],
  "akaretler": [41.0410, 28.9995],
  "sinanpaşa": [41.0425, 29.0065],
  "gayrettepe": [41.0665, 29.0125],
  "levent": [41.0820, 29.0140],
  "etiler": [41.0830, 29.0320],
  "bebek": [41.0760, 29.0430],
  "ortaköy": [41.0480, 29.0250],
  "balmumcu": [41.0580, 29.0110],
  "abbasağa": [41.0460, 29.0040],
  "akatlar": [41.0860, 29.0260],
  "kuruçeşme": [41.0600, 29.0340],
  "arnavutköy (beşiktaş)": [41.0670, 29.0420],

  // Kadıköy
  "kadıköy": [40.9910, 29.0295],
  "moda": [40.9855, 29.0270],
  "caferağa": [40.9855, 29.0270],
  "osmanağa": [40.9910, 29.0295],
  "rasimpaşa": [40.9950, 29.0300],
  "fenerbahçe": [40.9750, 29.0410],
  "caddebostan": [40.9670, 29.0620],
  "suadiye": [40.9610, 29.0830],
  "bostancı": [40.9540, 29.0960],
  "koşuyolu": [41.0080, 29.0370],
  "acıbadem": [41.0020, 29.0450],
  "göztepe": [40.9780, 29.0600],
  "erenköy": [40.9700, 29.0760],
  "fikirtepe": [40.9960, 29.0500],
  "hasanpaşa": [40.9980, 29.0380],

  // Üsküdar
  "üsküdar": [41.0260, 29.0150],
  "kuzguncuk": [41.0360, 29.0280],
  "beylerbeyi": [41.0430, 29.0450],
  "çengelköy": [41.0500, 29.0530],
  "altunizade": [41.0220, 29.0410],
  "kandilli": [41.0740, 29.0630],
  "selimiye": [41.0140, 29.0180],
  "bağlarbaşı": [41.0250, 29.0300],

  // Bakırköy
  "bakırköy": [40.9780, 28.8730],
  "yeşilköy": [40.9610, 28.8260],
  "florya": [40.9720, 28.7900],
  "ataköy": [40.9820, 28.8600],
  "zuhuratbaba": [40.9840, 28.8690],
  "kartaltepe": [40.9880, 28.8780],
  "yeşilyurt": [40.9650, 28.8450],

  // Beyoğlu
  "beyoğlu": [41.0370, 28.9770],
  "istiklal": [41.0340, 28.9780],
  "cihangir": [41.0330, 28.9830],
  "karaköy": [41.0240, 28.9770],
  "galata": [41.0255, 28.9740],
  "kasımpaşa": [41.0350, 28.9660],
  "asmakımescit": [41.0310, 28.9750],
  "asmali mescit": [41.0310, 28.9750],
  "asmalımescit": [41.0310, 28.9750],
  "hüseyinağa": [41.0360, 28.9790],
  "tomtom": [41.0310, 28.9780],
  "pürtelaş": [41.0320, 28.9890],
  "şişhane": [41.0290, 28.9720],

  // Fatih
  "fatih": [41.0180, 28.9480],
  "eminönü": [41.0160, 28.9710],
  "sultanahmet": [41.0060, 28.9770],
  "balat": [41.0320, 28.9480],
  "fener": [41.0290, 28.9510],
  "aksaray": [41.0110, 28.9500],
  "çapa": [41.0140, 28.9370],
  "haseki": [41.0100, 28.9420],
  "kocamustafapaşa": [40.9990, 28.9350],
  "karagümrük": [41.0280, 28.9380],

  // Sarıyer
  "sarıyer": [41.1667, 29.0500],
  "maslak": [41.1100, 29.0200],
  "tarabya": [41.1390, 29.0550],
  "istinye": [41.1120, 29.0550],
  "yeniköy": [41.1210, 29.0680],
  "emirgan": [41.1060, 29.0540],
  "rumeli hisarı": [41.0850, 29.0560],
  "ayazağa": [41.1080, 28.9970],
  "zekeriyaköy": [41.2050, 29.0250],

  // Anadolu & Avrupa Diğer
  "maltepe": [40.9250, 29.1350],
  "küçükyalı": [40.9480, 29.1120],
  "idealtepe": [40.9410, 29.1210],
  "kartal": [40.8900, 29.1850],
  "pendik": [40.8750, 29.2300],
  "tuzla": [40.8150, 29.3050],
  "ataşehir": [40.9850, 29.1150],
  "ümraniye": [41.0250, 29.0950],
  "çekmeköy": [41.0350, 29.1800],
  "sancaktepe": [40.9950, 29.2350],
  "beykoz": [41.1250, 29.1000],
  "kavacık": [41.0900, 29.0950],
  "zeytinburnu": [40.9900, 28.9000],
  "güngören": [41.0200, 28.8750],
  "bahçelievler": [40.9980, 28.8600],
  "şirinevler": [40.9980, 28.8450],
  "bağcılar": [41.0350, 28.8550],
  "esenler": [41.0400, 28.8900],
  "gaziosmanpaşa": [41.0600, 28.9150],
  "sultangazi": [41.1050, 28.8650],
  "başakşehir": [41.0950, 28.8050],
  "küçükçekmece": [40.9950, 28.7750],
  "cennet": [40.9880, 28.7850],
  "sefaköy": [41.0050, 28.7950],
  "avcılar": [40.9800, 28.7200],
  "beylikdüzü": [41.0000, 28.6450],
  "esenyurt": [41.0350, 28.6750],
  "büyükçekmece": [41.0200, 28.5850],
  "silivri": [41.0740, 28.2460],
  "çatalca": [41.1440, 28.4610],
  "arnavutköy": [41.1850, 28.7400],
  "adalar": [40.8750, 29.1300],
  "büyükada": [40.8750, 29.1300],
  "şile": [41.1760, 29.6130],
  "istanbul": [41.0082, 28.9784],
  "istanbul (tüm bölgeler)": [41.0082, 28.9784],

  // ==========================================
  // 2. ANKARA
  // ==========================================
  "çankaya": [39.9050, 32.8600],
  "kızılay": [39.9208, 32.8541],
  "tunalı": [39.9050, 32.8600],
  "tunalı hilmi": [39.9050, 32.8600],
  "kavaklıdere": [39.9060, 32.8600],
  "bahçelievler (7. cadde)": [39.9230, 32.8220],
  "gaziosmanpaşa (gop)": [39.8970, 32.8710],
  "gop": [39.8970, 32.8710],
  "ayrancı": [39.8980, 32.8520],
  "balgat": [39.8910, 32.8190],
  "çayyolu": [39.8780, 32.6950],
  "ümitköy": [39.8900, 32.7050],
  "bilkent": [39.8700, 32.7500],
  "yıldız": [39.8780, 32.8650],
  "oran": [39.8550, 32.8350],
  "esat": [39.9120, 32.8650],
  "maltepe (ankara)": [39.9280, 32.8450],
  "altındağ": [39.9450, 32.8650],
  "ulus": [39.9420, 32.8550],
  "hamamönü": [39.9350, 32.8670],
  "aydınlıkevler": [39.9600, 32.8800],
  "kale (ankara)": [39.9410, 32.8640],
  "keçiören": [39.9800, 32.8650],
  "etlik": [39.9700, 32.8350],
  "incirli (ankara)": [39.9750, 32.8550],
  "kalaba": [39.9760, 32.8720],
  "bağlum": [40.0400, 32.8450],
  "yenimahalle": [39.9700, 32.7950],
  "batıkent": [39.9650, 32.7350],
  "demetevler": [39.9620, 32.8050],
  "ostim": [39.9720, 32.7450],
  "şentepe": [39.9850, 32.7850],
  "etimesgut": [39.9500, 32.6750],
  "eryaman": [39.9850, 32.6150],
  "bağlıca": [39.8950, 32.6450],
  "elvankent": [39.9380, 32.6150],
  "gölbaşı (ankara)": [39.7900, 32.8050],
  "incek": [39.8350, 32.7250],
  "sincan": [39.9600, 32.5800],
  "mamak": [39.9250, 32.9150],
  "pursaklar": [40.0350, 32.9050],
  "ankara": [39.9208, 32.8541],
  "ankara (tüm bölgeler)": [39.9208, 32.8541],

  // ==========================================
  // 3. İZMİR
  // ==========================================
  "konak": [38.4200, 27.1350],
  "alsancak": [38.4350, 27.1420],
  "kordon": [38.4320, 27.1380],
  "göztepe (izmir)": [38.3980, 27.0850],
  "küçükyalı (izmir)": [38.4080, 27.1080],
  "pasaport": [38.4280, 27.1340],
  "basmane": [38.4220, 27.1450],
  "kemeraltı": [38.4190, 27.1320],
  "karşıyaka": [38.4570, 27.1120],
  "bostanlı": [38.4570, 27.1050],
  "mavişehir": [38.4680, 27.0850],
  "alaybey": [38.4600, 27.1250],
  "şemikler": [38.4720, 27.1020],
  "bornova": [38.4650, 27.2150],
  "küçükpark": [38.4610, 27.2250],
  "özkanlar": [38.4590, 27.2000],
  "kazımdirik": [38.4620, 27.2100],
  "bayraklı": [38.4620, 27.1700],
  "manavkuyu": [38.4580, 27.1850],
  "mansuroğlu": [38.4550, 27.1800],
  "buca": [38.3850, 27.1750],
  "şirinyer": [38.3950, 27.1580],
  "balçova": [38.3900, 27.0500],
  "narlıdere": [38.3850, 27.0150],
  "çiğli": [38.4900, 27.0650],
  "gaziemir": [38.3200, 27.1350],
  "karabağlar": [38.3750, 27.1200],
  "çeşme": [38.3200, 26.3050],
  "alaçatı": [38.2800, 26.3750],
  "urla": [38.3200, 26.7650],
  "seferihisar": [38.1950, 26.8400],
  "sığacık": [38.1980, 26.7850],
  "foça": [38.6700, 26.7550],
  "kuşadası": [37.8600, 27.2600],
  "izmir": [38.4237, 27.1428],
  "izmir (tüm bölgeler)": [38.4237, 27.1428],

  // ==========================================
  // 4. BURSA
  // ==========================================
  "osmangazi": [40.1950, 29.0600],
  "heykel": [40.1830, 29.0650],
  "altıparmak": [40.1900, 29.0520],
  "çekirge": [40.1980, 29.0280],
  "fomara": [40.1900, 29.0600],
  "muradiye": [40.1920, 29.0500],
  "nilüfer": [40.2150, 28.9850],
  "fsm bulvarı": [40.2180, 28.9790],
  "özlüce": [40.2250, 28.9150],
  "görükle": [40.2280, 28.8450],
  "beşevler": [40.2050, 28.9750],
  "ihsaniye": [40.2120, 28.9900],
  "yıldırım": [40.1850, 29.0950],
  "mudanya": [40.3750, 28.8850],
  "güzelyalı": [40.3600, 28.9150],
  "gemlik": [40.4300, 29.1600],
  "inegöl": [40.0800, 29.5100],
  "bursa": [40.1885, 29.0610],
  "bursa (tüm bölgeler)": [40.1885, 29.0610],

  // ==========================================
  // 5. ANTALYA
  // ==========================================
  "muratpaşa": [36.8850, 30.7080],
  "kaleiçi": [36.8840, 30.7040],
  "lara": [36.8550, 30.7850],
  "ışıklar": [36.8800, 30.7100],
  "şirinyalı": [36.8650, 30.7450],
  "fener (antalya)": [36.8550, 30.7600],
  "konyaaltı": [36.8750, 30.6350],
  "arapsuyu": [36.8780, 30.6480],
  "altınkum": [36.8720, 30.6300],
  "gürsu": [36.8680, 30.6200],
  "liman": [36.8500, 30.6050],
  "kepez": [36.9350, 30.6950],
  "dokuma": [36.9200, 30.6800],
  "alanya": [36.5450, 31.9950],
  "damlataş": [36.5420, 31.9880],
  "mahmutlar": [36.4900, 32.0950],
  "kaş": [36.2000, 29.6380],
  "kalkan": [36.2650, 29.4150],
  "manavgat": [36.7850, 31.4450],
  "side": [36.7680, 31.3900],
  "kemer": [36.6000, 30.5600],
  "serik": [36.9180, 31.1000],
  "belek": [36.8620, 31.0550],
  "antalya": [36.8969, 30.7133],
  "antalya (tüm bölgeler)": [36.8969, 30.7133],

  // ==========================================
  // 6. ESKİŞEHİR
  // ==========================================
  "tepebaşı": [39.7850, 30.5100],
  "bağlar": [39.7830, 30.5050],
  "doktorlar caddesi": [39.7780, 30.5150],
  "espark civarı": [39.7820, 30.5080],
  "batıkent (eskişehir)": [39.8050, 30.4850],
  "odunpazarı": [39.7600, 30.5250],
  "tarihi odunpazarı evleri": [39.7580, 30.5280],
  "adalar (eskişehir)": [39.7730, 30.5180],
  "vişnelik": [39.7650, 30.5050],
  "eskişehir": [39.7767, 30.5206],
  "eskişehir (tüm bölgeler)": [39.7767, 30.5206],

  // ==========================================
  // 7. DİĞER TÜM BÜYÜKŞEHİR MERKEZLERİ
  // ==========================================
  "adana": [37.0000, 35.3213],
  "seyhan": [36.9910, 35.3280],
  "çukurova": [37.0500, 35.2900],
  "yüreğir": [36.9850, 35.3500],
  "konya": [37.8746, 32.4932],
  "selçuklu": [37.9150, 32.4900],
  "meram": [37.8550, 32.4500],
  "karatay": [37.8750, 32.5300],
  "gaziantep": [37.0662, 37.3833],
  "şahinbey": [37.0450, 37.3750],
  "şehitkamil": [37.0850, 37.3850],
  "mersin": [36.8121, 34.6415],
  "yenişehir (mersin)": [36.7850, 34.5850],
  "mezitli": [36.7550, 34.5350],
  "akdeniz": [36.8150, 34.6350],
  "kayseri": [38.7205, 35.4826],
  "melikgazi": [38.7250, 35.5000],
  "kocasinan": [38.7400, 35.4750],
  "telas": [38.6900, 35.5500],
  "samsun": [41.2867, 36.3300],
  "atakum": [41.3250, 36.2750],
  "ilkadım": [41.2850, 36.3350],
  "canik": [41.2750, 36.3600],
  "trabzon": [41.0027, 39.7168],
  "ortahisar": [41.0027, 39.7168],
  "akçaabat": [41.0200, 39.5700],
  "denizli": [37.7765, 29.0864],
  "pamukkale": [37.7850, 29.0950],
  "merkezefendi": [37.7700, 29.0750],
  "diyarbakır": [37.9144, 40.2306],
  "kayapınar": [37.9400, 40.1800],
  "bağlar (diyarbakır)": [37.9100, 40.2000],
  "sur": [37.9150, 40.2350],
  "şanlıurfa": [37.1674, 38.7955],
  "haliliye": [37.1650, 38.8100],
  "eyyübiye": [37.1450, 38.7850],
  "karaköprü": [37.2100, 38.8050],
  "muğla": [37.2153, 28.3636],
  "bodrum": [37.0344, 27.4305],
  "fethiye": [36.6217, 29.1164],
  "marmaris": [36.8550, 28.2742],
  "datça": [36.7250, 27.6850],
  "sakarya": [40.7569, 30.3783],
  "adapazarı": [40.7750, 30.4000],
  "serdivan": [40.7600, 30.3650],
  "kocaeli": [40.8533, 29.8815],
  "izmit": [40.7650, 29.9400],
  "gebze": [40.8020, 29.4300],
  "darica": [40.7750, 29.3850],
  "türkiye": [39.0000, 35.0000],
  "tüm türkiye": [41.0775, 28.9665],
};

function normalizeKey(str: string): string {
  return str
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

/**
 * Calculate distance in meters between two lat/lon points using Haversine formula
 */
export function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

/**
 * Returns exact coordinates for a given location query (city, district, neighborhood)
 */
export function getCoordinatesForLocation(
  city?: string,
  district?: string,
  neighborhood?: string
): [number, number] | null {
  if (neighborhood && neighborhood.trim()) {
    const nhNorm = normalizeKey(neighborhood);
    for (const [key, coords] of Object.entries(LOCATION_COORDINATES)) {
      const kNorm = normalizeKey(key);
      if (kNorm === nhNorm || nhNorm.includes(kNorm) || kNorm.includes(nhNorm)) {
        return coords;
      }
    }
  }

  if (district && district.trim() && district !== "Tüm Bölgeler") {
    const distNorm = normalizeKey(district);
    for (const [key, coords] of Object.entries(LOCATION_COORDINATES)) {
      const kNorm = normalizeKey(key);
      if (kNorm === distNorm || distNorm.includes(kNorm) || kNorm.includes(distNorm)) {
        return coords;
      }
    }
  }

  if (city && city.trim() && city !== "Tüm Şehirler") {
    const cityNorm = normalizeKey(city);
    for (const [key, coords] of Object.entries(LOCATION_COORDINATES)) {
      const kNorm = normalizeKey(key);
      if (kNorm === cityNorm || cityNorm.includes(kNorm) || kNorm.includes(cityNorm)) {
        return coords;
      }
    }
  }

  return null;
}

/**
 * Returns exact coordinates for a given merchant
 */
export function getMerchantCoordinates(m: Merchant): [number, number] {
  if (m.coordinates && typeof m.coordinates.lat === "number" && typeof m.coordinates.lng === "number") {
    return [m.coordinates.lat, m.coordinates.lng];
  }

  const coords = getCoordinatesForLocation(m.city, m.district, m.neighborhood);
  if (coords) return coords;

  const text = `${m.neighborhood || ""} ${m.district || ""} ${m.city || ""} ${m.address || ""}`.toLowerCase();
  for (const [key, c] of Object.entries(LOCATION_COORDINATES)) {
    if (text.includes(key.toLowerCase())) return c;
  }

  return [41.0775, 28.9665];
}

/**
 * Find closest district/city from coordinates
 */
export function findNearestDistrictAndCity(lat: number, lon: number): {
  key: string;
  coords: [number, number];
  distanceMeters: number;
} {
  let closestKey = "istanbul";
  let closestCoords: [number, number] = [41.0775, 28.9665];
  let minDistance = Infinity;

  for (const [key, coords] of Object.entries(LOCATION_COORDINATES)) {
    if (key.includes("tüm") || key === "türkiye") continue;
    const d = getDistanceInMeters(lat, lon, coords[0], coords[1]);
    if (d < minDistance) {
      minDistance = d;
      closestKey = key;
      closestCoords = coords;
    }
  }

  return {
    key: closestKey,
    coords: closestCoords,
    distanceMeters: minDistance,
  };
}
