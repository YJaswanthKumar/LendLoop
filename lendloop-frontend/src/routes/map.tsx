import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LocateFixed } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AssetCard } from "@/components/AssetCard";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Loader } from "@/components/Loader";
import { getApiError } from "@/api/api";
import { nearbyAssets } from "@/services/assetService";
import { DEFAULT_CENTER, getBrowserLocation } from "@/utils/locationUtils";
import type { Asset } from "@/utils/types";
import type { LeafletMapView as LeafletMapViewType } from "@/components/LeafletMapView";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Map view — LendLoop" },
      { name: "description", content: "See rentable items near you on an interactive map." },
      { property: "og:title", content: "Map view — LendLoop" },
      { property: "og:description", content: "Nearby rentable items on a live map." },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [radius, setRadius] = useState(25);
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [MapView, setMapView] = useState<typeof LeafletMapViewType | null>(null);
  const mapLoadedRef = useRef(false);

  useEffect(() => {
    getBrowserLocation().then((loc) => {
      if (loc) setCenter(loc);
    });
  }, []);

  useEffect(() => {
    if (mapLoadedRef.current) return;
    mapLoadedRef.current = true;
    import("@/components/LeafletMapView").then((m) => {
      setMapView(() => m.LeafletMapView);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    nearbyAssets(center.latitude, center.longitude, radius, 1, 100)
      .then((d) => setAssets(d.assets))
      .catch((err) => setError(getApiError(err)))
      .finally(() => setLoading(false));
  }, [center, radius]);

  const recentre = async () => {
    const loc = await getBrowserLocation();
    if (loc) setCenter(loc);
  };

  const mapCenter: [number, number] = [center.latitude, center.longitude];

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

      <div className="relative mt-5 overflow-hidden rounded-2xl border border-border shadow-(--shadow-card)">
        {MapView ? (
          <MapView
            center={mapCenter}
            assets={assets}
            onAssetClick={(id) => navigate({ to: "/assets/$assetId", params: { assetId: id } })}
          />
        ) : (
          <div className="flex h-[60vh] items-center justify-center bg-muted text-sm text-muted-foreground">
            Loading map…
          </div>
        )}
      </div>

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
