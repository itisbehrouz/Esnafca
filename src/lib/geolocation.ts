/**
 * Safe Browser Geolocation Service
 *
 * Protects against browser extensions (such as ExpressVPN Location Spoofing)
 * that stringify and eval callback functions in isolated or global scopes.
 * Ensures React component state setters (e.g. setIsLocating) are never
 * exposed to external eval environments.
 */

export interface SafeCoordinates {
  latitude: number;
  longitude: number;
}

// Global safety guard against extensions executing legacy spoof code referencing setIsLocating
if (typeof window !== "undefined") {
  if (typeof (window as any).setIsLocating === "undefined") {
    (window as any).setIsLocating = function () {
      // Safe no-op for any third-party extension eval
    };
  }
}

/**
 * Pure GPS position callback with zero closure dependencies.
 * If serialized by an extension, it accesses only standard browser globals.
 */
function handleGpsSuccess(position: GeolocationPosition) {
  try {
    if (position && position.coords) {
      const lat = Number(position.coords.latitude);
      const lon = Number(position.coords.longitude);
      if (typeof window !== "undefined" && typeof (window as any).__ESNAF_GEO_ON_SUCCESS === "function") {
        (window as any).__ESNAF_GEO_ON_SUCCESS(lat, lon);
      }
    }
  } catch (_) {
    // Ignore internal callback execution error
  }
}

function handleGpsError(error: GeolocationPositionError) {
  try {
    const message = error && error.message ? error.message : "Konum alınamadı";
    if (typeof window !== "undefined" && typeof (window as any).__ESNAF_GEO_ON_ERROR === "function") {
      (window as any).__ESNAF_GEO_ON_ERROR(message);
    }
  } catch (_) {
    // Ignore internal callback execution error
  }
}

/**
 * Retrieves the user's current GPS position via a safe Promise.
 * Does not pass React closures or state setters into navigator.geolocation.
 */
export function getSafeCurrentPosition(
  options: PositionOptions = { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
): Promise<SafeCoordinates> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      reject(new Error("Tarayıcınız konum servisini desteklemiyor."));
      return;
    }

    let isSettled = false;
    let timer: NodeJS.Timeout | null = null;

    const cleanup = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      if (typeof window !== "undefined") {
        delete (window as any).__ESNAF_GEO_ON_SUCCESS;
        delete (window as any).__ESNAF_GEO_ON_ERROR;
      }
    };

    (window as any).__ESNAF_GEO_ON_SUCCESS = (lat: number, lon: number) => {
      if (isSettled) return;
      isSettled = true;
      cleanup();
      resolve({ latitude: lat, longitude: lon });
    };

    (window as any).__ESNAF_GEO_ON_ERROR = (errorMessage: string) => {
      if (isSettled) return;
      isSettled = true;
      cleanup();
      reject(new Error(errorMessage));
    };

    const timeoutDuration = options.timeout ? options.timeout + 1000 : 9000;
    timer = setTimeout(() => {
      if (isSettled) return;
      isSettled = true;
      cleanup();
      reject(new Error("Konum isteği zaman aşımına uğradı."));
    }, timeoutDuration);

    try {
      navigator.geolocation.getCurrentPosition(handleGpsSuccess, handleGpsError, options);
    } catch (err) {
      if (!isSettled) {
        isSettled = true;
        cleanup();
        reject(err instanceof Error ? err : new Error("Konum servisi çağrılamadı."));
      }
    }
  });
}
