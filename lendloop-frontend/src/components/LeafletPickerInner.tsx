import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { DEFAULT_CENTER } from "@/utils/locationUtils";
import type { LocationValue } from "./LocationPicker";

const pickerIcon = L.divIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
    <path fill="#1d9a5b" stroke="white" stroke-width="1.5"
      d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24S24 21 24 12C24 5.373 18.627 0 12 0z"/>
    <circle fill="white" cx="12" cy="12" r="5"/>
  </svg>`,
  className: "",
  iconSize: [24, 36],
  iconAnchor: [12, 36],
  popupAnchor: [0, -38],
});

/** Recentres the map whenever the picked position changes externally (e.g. "Use my location"). */
function RecenterOnExternalChange({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, map.getZoom());
  }, [position, map]);
  return null;
}

function ClickMarker({
  position,
  onPick,
}: {
  position: [number, number] | null;
  onPick: (pos: [number, number]) => void;
}) {
  useMapEvents({
    click(e) {
      onPick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return position ? <Marker position={position} icon={pickerIcon} /> : null;
}

export function LeafletPickerInner({
  value,
  onChange,
}: {
  value: LocationValue;
  onChange: (v: LocationValue) => void;
}) {
  const initial: [number, number] =
    value.latitude != null && value.longitude != null
      ? [value.latitude, value.longitude]
      : [DEFAULT_CENTER.latitude, DEFAULT_CENTER.longitude];

  const [markerPos, setMarkerPos] = useState<[number, number] | null>(
    value.latitude != null && value.longitude != null ? initial : null,
  );

  // Keep the pin in sync when the coordinates change from outside the map
  // (e.g. the "Use my location" button, or the manual lat/lng inputs).
  useEffect(() => {
    if (value.latitude != null && value.longitude != null) {
      setMarkerPos([value.latitude, value.longitude]);
    } else {
      setMarkerPos(null);
    }
  }, [value.latitude, value.longitude]);

  const handlePick = ([lat, lng]: [number, number]) => {
    const pos: [number, number] = [Number(lat.toFixed(6)), Number(lng.toFixed(6))];
    setMarkerPos(pos);
    onChange({ latitude: pos[0], longitude: pos[1] });
  };

  return (
    <MapContainer center={initial} zoom={13} scrollWheelZoom style={{ height: 224, width: "100%" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <RecenterOnExternalChange position={markerPos} />
      <ClickMarker position={markerPos} onPick={handlePick} />
    </MapContainer>
  );
}
