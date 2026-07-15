import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import {
  Circle,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { formatPrice } from "@/utils/format";
import type { Asset } from "@/utils/types";

const pinIcon = (color = "#1d9a5b") =>
  L.divIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
      <path fill="${color}" stroke="white" stroke-width="1.5"
        d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24S24 21 24 12C24 5.373 18.627 0 12 0z"/>
      <circle fill="white" cx="12" cy="12" r="5"/>
    </svg>`,
    className: "",
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -38],
  });

const userIcon = L.divIcon({
  html: `<span style="display:block;width:16px;height:16px;border-radius:50%;background:#2563eb;border:3px solid white;box-shadow:0 0 0 2px rgba(37,99,235,0.4);"></span>`,
  className: "",
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const clickIcon = L.divIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="22" height="33">
    <path fill="#f59e0b" stroke="white" stroke-width="1.5"
      d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24S24 21 24 12C24 5.373 18.627 0 12 0z"/>
    <circle fill="white" cx="12" cy="12" r="5"/>
  </svg>`,
  className: "",
  iconSize: [22, 33],
  iconAnchor: [11, 33],
  popupAnchor: [0, -35],
});

function MapRecenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

function MapClickCapture({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function LeafletMapView({
  center,
  assets,
  onAssetClick,
  onMapClick,
  userLocation,
  clickedPoint,
  radiusKm,
}: {
  center: [number, number];
  assets: Asset[];
  onAssetClick: (id: string) => void;
  onMapClick?: (lat: number, lng: number) => void;
  userLocation?: [number, number] | null;
  clickedPoint?: [number, number] | null;
  radiusKm?: number;
}) {
  const mappable = assets.filter((a) => a.latitude != null && a.longitude != null);

  return (
    <MapContainer
      center={center}
      zoom={12}
      scrollWheelZoom
      style={{ height: "60vh", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <MapRecenter center={center} />
      <MapClickCapture onMapClick={onMapClick} />
      {userLocation && (
        <>
          <Marker position={userLocation} icon={userIcon}>
            <Popup>
              Your location
              <br />
              {userLocation[0].toFixed(6)}, {userLocation[1].toFixed(6)}
            </Popup>
          </Marker>
          {radiusKm ? (
            <Circle
              center={userLocation}
              radius={radiusKm * 1000}
              pathOptions={{ color: "#2563eb", fillColor: "#2563eb", fillOpacity: 0.06, weight: 1 }}
            />
          ) : null}
        </>
      )}
      {clickedPoint && (
        <Marker position={clickedPoint} icon={clickIcon}>
          <Popup>
            Selected point
            <br />
            {clickedPoint[0].toFixed(6)}, {clickedPoint[1].toFixed(6)}
          </Popup>
        </Marker>
      )}
      {mappable.map((a) => (
        <Marker key={a.id} position={[a.latitude!, a.longitude!]} icon={pinIcon()}>
          <Popup maxWidth={220}>
            <div style={{ minWidth: 180 }}>
              {a.image_url && (
                <img
                  src={a.image_url}
                  alt={a.title}
                  style={{
                    width: "100%",
                    height: 88,
                    objectFit: "cover",
                    borderRadius: 8,
                    display: "block",
                    marginBottom: 6,
                  }}
                />
              )}
              <div style={{ fontWeight: 700, fontSize: 14 }}>{a.title}</div>
              <div style={{ fontSize: 13, color: "#555", marginTop: 2 }}>
                {formatPrice(a.expected_price_per_day)} / day
              </div>
              {(a.distance_km != null || a.city) && (
                <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
                  {a.distance_km != null && Number(a.distance_km) >= 0.1
                    ? `${Number(a.distance_km).toFixed(1)} km away`
                    : (a.city ?? "Nearby")}
                </div>
              )}
              <button
                onClick={() => onAssetClick(a.id)}
                style={{
                  marginTop: 8,
                  width: "100%",
                  padding: "6px 10px",
                  borderRadius: 9999,
                  background: "#1d9a5b",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 12,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Open details
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
