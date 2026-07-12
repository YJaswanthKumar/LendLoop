import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LocateFixed, Map as MapIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { GOOGLE_MAPS_API_KEY } from "@/api/config";
import { AssetCard } from "@/components/AssetCard";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Loader } from "@/components/Loader";
import { getApiError } from "@/api/api";
import { nearbyAssets } from "@/services/assetService";
import { formatPrice } from "@/utils/format";
import { DEFAULT_CENTER, getBrowserLocation, loadGoogleMaps } from "@/utils/googleMaps";
import type { Asset } from "@/utils/types";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Map view — LendLoop" },
      { name: "description", content: "See rentable items near you on an interactive map, Uber-style." },
      { property: "og:title", content: "Map view — LendLoop" },
      { property: "og:description", content: "Nearby rentable items on a live map." },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapObj = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoRef = useRef<any>(null);

  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [radius, setRadius] = useState(25);
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const noKey = !GOOGLE_MAPS_API_KEY;

  // Get location once
  useEffect(() => {
    getBrowserLocation().then((loc) => {
      if (loc) setCenter(loc);
    });
  }, []);

  // Fetch nearby assets
  useEffect(() => {
    setLoading(true);
    setError(null);
    nearbyAssets(center.latitude, center.longitude, radius, 1, 100)
      .then((d) => setAssets(d.assets))
      .catch((err) => setError(getApiError(err)))
      .finally(() => setLoading(false));
  }, [center, radius]);

  // Init map
  useEffect(() => {
    if (noKey) return;
    let cancelled = false;
    loadGoogleMaps().then((google) => {
      if (cancelled || !google || !mapRef.current || mapObj.current) return;
      mapObj.current = new google.maps.Map(mapRef.current, {
        center: { lat: center.latitude, lng: center.longitude },
        zoom: 12,
        disableDefaultUI: true,
        zoomControl: true,
      });
      infoRef.current = new google.maps.InfoWindow();
      setMapReady(true);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noKey]);

  // Recentre + markers
  useEffect(() => {
    const google = (window as any).google;
    const map = mapObj.current;
    if (!mapReady || !google || !map) return;

    map.setCenter({ lat: center.latitude, lng: center.longitude });
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    assets
      .filter((a) => a.latitude != null && a.longitude != null)
      .forEach((a) => {
        const marker = new google.maps.Marker({
          position: { lat: a.latitude, lng: a.longitude },
          map,
          title: a.title,
        });
        marker.addListener("click", () => {
          const img = a.image_url
            ? `<img src="${a.image_url}" alt="" style="width:100%;height:96px;object-fit:cover;border-radius:8px;margin-bottom:8px" />`
            : "";
          const dist =
            a.distance_km != null
              ? `<div style="font-size:12px;color:#6b7280;margin-top:2px">${Number(a.distance_km).toFixed(1)} km away</div>`
              : "";
          infoRef.current.setContent(
            `<div style="max-width:200px;font-family:inherit">
              ${img}
              <div style="font-weight:700;font-size:14px">${escapeHtml(a.title)}</div>
              <div style="font-size:13px;margin-top:2px">${formatPrice(a.expected_price_per_day)} / day</div>
              ${dist}
              <button id="ll-open-${a.id}" style="margin-top:8px;width:100%;padding:6px 10px;border-radius:9999px;background:#1d9a5b;color:#fff;font-weight:600;font-size:12px;border:none;cursor:pointer">Open details</button>
            </div>`,
          );
          infoRef.current.open({ map, anchor: marker });
          google.maps.event.addListenerOnce(infoRef.current, "domready", () => {
            document
              .getElementById(`ll-open-${a.id}`)
              ?.addEventListener("click", () =>
                navigate({ to: "/assets/$assetId", params: { assetId: a.id } }),
              );
          });
        });
        markersRef.current.push(marker);
      });
  }, [assets, mapReady, center, navigate]);

  const recentre = async () => {
    const loc = await getBrowserLocation();
    if (loc) setCenter(loc);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Items near you</h1>
          <p className="text-sm text-muted-foreground">
            {assets.length} item{assets.length === 1 ? "" : "s"} within {radius} km
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="input-base w-auto"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
          >
            <option value={5}>5 km</option>
            <option value={10}>10 km</option>
            <option value={25}>25 km</option>
            <option value={50}>50 km</option>
          </select>
          <button onClick={recentre} className="btn-outline px-4 py-2.5 text-sm" title="Use my location">
            <LocateFixed className="h-4 w-4" /> My location
          </button>
        </div>
      </div>

      {!noKey ? (
        <div className="relative mt-5 overflow-hidden rounded-2xl border border-border shadow-(--shadow-card)">
          <div ref={mapRef} className="h-[60vh] w-full bg-muted" />
          {!mapReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted text-sm text-muted-foreground">
              Loading map…
            </div>
          )}
        </div>
      ) : (
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/50 px-5 py-4 text-sm text-muted-foreground">
          <MapIcon className="h-5 w-5 shrink-0" />
          Set <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-xs">VITE_GOOGLE_MAPS_API_KEY</code>
          to enable the interactive map. Nearby items are listed below.
        </div>
      )}

      <div className="mt-8">
        <h2 className="mb-4 text-lg font-bold">Nearby listings</h2>
        {loading ? (
          <Loader label="Locating items near you…" />
        ) : error ? (
          <ErrorState message={error} />
        ) : assets.length === 0 ? (
          <EmptyState
            title="Nothing nearby yet"
            description="Try a bigger radius, or be the first to list an item in your area."
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {assets.map((a) => (
              <AssetCard key={a.id} asset={a} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
