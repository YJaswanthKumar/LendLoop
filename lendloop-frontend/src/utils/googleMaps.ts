import { GOOGLE_MAPS_API_KEY } from "@/api/config";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    google?: any;
    __lendloopInitMaps?: () => void;
  }
}

let loaderPromise: Promise<any | null> | null = null;

/** Lazily load the Google Maps JS API. Resolves null when no key is configured. */
export function loadGoogleMaps(): Promise<any | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (!GOOGLE_MAPS_API_KEY) return Promise.resolve(null);
  if (window.google?.maps) return Promise.resolve(window.google);
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise((resolve) => {
    window.__lendloopInitMaps = () => resolve(window.google ?? null);
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&loading=async&callback=__lendloopInitMaps`;
    script.async = true;
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });
  return loaderPromise;
}

export function getBrowserLocation(): Promise<{ latitude: number; longitude: number } | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 8000 },
    );
  });
}

/** Default map centre (Hyderabad) used when geolocation is unavailable. */
export const DEFAULT_CENTER = { latitude: 17.385, longitude: 78.4867 };
