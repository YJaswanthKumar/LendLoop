import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
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

function MapRecenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export function LeafletMapView({
  center,
  assets,
  onAssetClick,
}: {
  center: [number, number];
  assets: Asset[];
  onAssetClick: (id: string) => void;
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
      {mappable.map((a) => (
        <Marker
          key={a.id}
          position={[a.latitude!, a.longitude!]}
          icon={pinIcon()}
        >
          <Popup maxWidth={220}>
            <div style={{ minWidth: 180 }}>
              {a.image_url && (
                <img
                  src={a.image_url}
                  alt={a.title}
                  style={{ width: "100%", height: 88, objectFit: "cover", borderRadius: 8, display: "block", marginBottom: 6 }}
                />
              )}
              <div style={{ fontWeight: 700, fontSize: 14 }}>{a.title}</div>
              <div style={{ fontSize: 13, color: "#555", marginTop: 2 }}>{formatPrice(a.expected_price_per_day)} / day</div>
              {a.distance_km != null && (
                <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{Number(a.distance_km).toFixed(1)} km away</div>
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
