import { MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { GOOGLE_MAPS_API_KEY } from "@/api/config";
import { DEFAULT_CENTER, getBrowserLocation, loadGoogleMaps } from "@/utils/googleMaps";

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface LocationValue {
  latitude: number | null;
  longitude: number | null;
}

/**
 * Google Maps click-to-pick location. Falls back to manual coordinates when
 * no VITE_GOOGLE_MAPS_API_KEY is configured.
 */
export function LocationPicker({
  value,
  onChange,
}: {
  value: LocationValue;
  onChange: (v: LocationValue) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapObj = useRef<any>(null);
  const markerObj = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [noKey, setNoKey] = useState(!GOOGLE_MAPS_API_KEY);

  useEffect(() => {
    let cancelled = false;
    if (!GOOGLE_MAPS_API_KEY) return;

    (async () => {
      const google = await loadGoogleMaps();
      if (cancelled || !google || !mapRef.current) {
        if (!google) setNoKey(true);
        return;
      }
      const center = value.latitude != null && value.longitude != null
        ? { lat: value.latitude, lng: value.longitude }
        : await getBrowserLocation().then((loc) =>
            loc
              ? { lat: loc.latitude, lng: loc.longitude }
              : { lat: DEFAULT_CENTER.latitude, lng: DEFAULT_CENTER.longitude },
          );
      if (cancelled || !mapRef.current) return;

      const map = new google.maps.Map(mapRef.current, {
        center,
        zoom: 13,
        disableDefaultUI: true,
        zoomControl: true,
      });
      mapObj.current = map;

      if (value.latitude != null && value.longitude != null) {
        markerObj.current = new google.maps.Marker({ position: center, map });
      }

      map.addListener("click", (e: any) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        if (markerObj.current) markerObj.current.setPosition(e.latLng);
        else markerObj.current = new google.maps.Marker({ position: e.latLng, map });
        onChange({ latitude: Number(lat.toFixed(6)), longitude: Number(lng.toFixed(6)) });
      });
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-3">
      {!noKey ? (
        <div className="relative overflow-hidden rounded-xl border border-border">
          <div ref={mapRef} className="h-56 w-full bg-muted" />
          {!ready && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
              Loading map…
            </div>
          )}
          <p className="border-t border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            <MapPin className="mr-1 inline h-3 w-3" />
            Tap on the map to drop a pin at the item's location.
          </p>
        </div>
      ) : (
        <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
          Add <code>VITE_GOOGLE_MAPS_API_KEY</code> to enable the interactive map. You can still
          enter coordinates manually below.
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">Latitude</label>
          <input
            type="number"
            step="any"
            className="input-base"
            value={value.latitude ?? ""}
            onChange={(e) =>
              onChange({ ...value, latitude: e.target.value === "" ? null : Number(e.target.value) })
            }
            placeholder="17.385"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">Longitude</label>
          <input
            type="number"
            step="any"
            className="input-base"
            value={value.longitude ?? ""}
            onChange={(e) =>
              onChange({ ...value, longitude: e.target.value === "" ? null : Number(e.target.value) })
            }
            placeholder="78.4867"
          />
        </div>
      </div>
    </div>
  );
}
