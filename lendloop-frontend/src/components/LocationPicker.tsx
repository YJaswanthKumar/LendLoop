import { MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { LeafletPickerInner as LeafletPickerInnerType } from "./LeafletPickerInner";

export interface LocationValue {
  latitude: number | null;
  longitude: number | null;
}

/**
 * OpenStreetMap / Leaflet click-to-pick location picker.
 * Leaflet is loaded dynamically (client-only) so SSR is safe.
 * Manual coordinate inputs are always available as fallback.
 */
export function LocationPicker({
  value,
  onChange,
}: {
  value: LocationValue;
  onChange: (v: LocationValue) => void;
}) {
  const [PickerInner, setPickerInner] = useState<typeof LeafletPickerInnerType | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    import("./LeafletPickerInner").then((m) => {
      setPickerInner(() => m.LeafletPickerInner);
    });
  }, []);

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-border">
        {PickerInner ? (
          <PickerInner value={value} onChange={onChange} />
        ) : (
          <div className="flex h-56 items-center justify-center bg-muted text-sm text-muted-foreground">
            Loading map…
          </div>
        )}
        <p className="border-t border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <MapPin className="mr-1 inline h-3 w-3" />
          Tap on the map to drop a pin at the item's location.
        </p>
      </div>
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
