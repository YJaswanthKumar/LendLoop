export interface GeoCoords {
  latitude: number;
  longitude: number;
}

/** Default map centre (Hyderabad) used when geolocation is unavailable. */
export const DEFAULT_CENTER: GeoCoords = { latitude: 17.385, longitude: 78.4867 };

/** Request the browser's current position. Resolves null on denial or timeout. */
export function getBrowserLocation(): Promise<GeoCoords | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 8000 },
    );
  });
}
