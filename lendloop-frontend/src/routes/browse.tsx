import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LocateFixed, SlidersHorizontal, Search as SearchIcon, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AssetCard } from "@/components/AssetCard";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Loader } from "@/components/Loader";
import { Pagination } from "@/components/Pagination";
import { getApiError } from "@/api/api";
import { listAssets, nearbyAssets, searchAssets } from "@/services/assetService";
import { DEFAULT_CENTER, getBrowserLocation } from "@/utils/locationUtils";
import { CATEGORIES, type Asset, type PaginationInfo } from "@/utils/types";
import type { LeafletMapView as LeafletMapViewType } from "@/components/LeafletMapView";

interface BrowseSearch {
  q?: string;
  category?: string;
}

export const Route = createFileRoute("/browse")({
  validateSearch: (search: Record<string, unknown>): BrowseSearch => ({
    q: typeof search.q === "string" && search.q ? search.q : undefined,
    category: typeof search.category === "string" && search.category ? search.category : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Browse items — LendLoop" },
      {
        name: "description",
        content:
          "Search, filter and map rentable items near you: electronics, tools, cameras, books and more.",
      },
      { property: "og:title", content: "Browse items — LendLoop" },
      { property: "og:description", content: "Find rentable items in your community." },
    ],
  }),
  component: BrowsePage,
});

function fmtCoord(n: number) {
  return n.toFixed(6);
}

function BrowsePage() {
  const { q: urlQ, category: urlCategory } = Route.useSearch();
  const navigate = useNavigate({ from: "/browse" });

  const [q, setQ] = useState(urlQ ?? "");
  const [category, setCategory] = useState(urlCategory ?? "");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [availability, setAvailability] = useState("");
  const [distance, setDistance] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [assets, setAssets] = useState<Asset[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Map state
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [clickedPoint, setClickedPoint] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);
  const [MapView, setMapView] = useState<typeof LeafletMapViewType | null>(null);
  const mapLoadedRef = useRef(false);

  // Keep center in a ref so fetchAssets can read the latest value without
  // needing it as a dep (prevents spurious re-fetches when geolocation resolves
  // while no distance filter is active).
  const centerRef = useRef(center);
  useEffect(() => { centerRef.current = center; }, [center]);

  const userLocationRef = useRef(userLocation);
  useEffect(() => { userLocationRef.current = userLocation; }, [userLocation]);

  useEffect(() => {
    if (mapLoadedRef.current) return;
    mapLoadedRef.current = true;
    import("@/components/LeafletMapView").then((m) => {
      setMapView(() => m.LeafletMapView);
    });
  }, []);

  useEffect(() => {
    setQ(urlQ ?? "");
    setCategory(urlCategory ?? "");
    setPage(1);
  }, [urlQ, urlCategory]);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (distance) {
        // Distance filter: use nearby endpoint, apply other filters client-side.
        const loc = userLocationRef.current
          ? { latitude: userLocationRef.current[0], longitude: userLocationRef.current[1] }
          : centerRef.current;
        const data = await nearbyAssets(loc.latitude, loc.longitude, Number(distance), page, 24);
        let list = data.assets;
        if (category)
          list = list.filter((a) => a.category.toLowerCase() === category.toLowerCase());
        if (minPrice) list = list.filter((a) => a.expected_price_per_day >= Number(minPrice));
        if (maxPrice) list = list.filter((a) => a.expected_price_per_day <= Number(maxPrice));
        if (q) list = list.filter((a) => a.title.toLowerCase().includes(q.toLowerCase()));
        setAssets(list);
        setPagination(data.pagination);
      } else if (category) {
        // Category filter: merge two result sets so we catch items that were
        // listed under a parent category (e.g. a camera filed under "Electronics").
        //   1. Exact category match via listAssets
        //   2. Text search on the keyword (e.g. "Cameras" → "camera") via searchAssets
        // Both sets are merged and deduplicated client-side, then paginated manually.
        const keyword = category.toLowerCase().replace(/s$/, ""); // "Cameras"→"camera"
        const priceAvailParams = {
          minPrice: minPrice ? Number(minPrice) : undefined,
          maxPrice: maxPrice ? Number(maxPrice) : undefined,
          availabilityStatus: availability || undefined,
        };
        const [exactData, textData] = await Promise.all([
          listAssets({ page: 1, limit: 100, category, ...priceAvailParams }),
          searchAssets(keyword, 1, 50),
        ]);

        // Merge: exact matches first, then any text-match not already included.
        const seen = new Set(exactData.assets.map((a) => a.id));
        const merged = [...exactData.assets];
        for (const a of textData.assets) {
          if (seen.has(a.id)) continue;
          // Apply price/availability filters to text-search results too
          if (priceAvailParams.minPrice && a.expected_price_per_day < priceAvailParams.minPrice) continue;
          if (priceAvailParams.maxPrice && a.expected_price_per_day > priceAvailParams.maxPrice) continue;
          if (priceAvailParams.availabilityStatus && a.availability_status !== priceAvailParams.availabilityStatus) continue;
          seen.add(a.id);
          merged.push(a);
        }

        // Apply optional text query filter on top
        let list = merged;
        if (q.trim()) {
          const lower = q.trim().toLowerCase();
          list = list.filter(
            (a) =>
              a.title.toLowerCase().includes(lower) ||
              (a.description ?? "").toLowerCase().includes(lower) ||
              (a.brand ?? "").toLowerCase().includes(lower),
          );
        }

        // Manual pagination over the merged set
        const pageSize = 24;
        const start = (page - 1) * pageSize;
        setAssets(list.slice(start, start + pageSize));
        setPagination({
          page,
          limit: pageSize,
          totalItems: list.length,
          totalPages: Math.max(1, Math.ceil(list.length / pageSize)),
        });
      } else if (q.trim()) {
        // Text search only (no category, no distance): use the dedicated search endpoint.
        const data = await searchAssets(q.trim(), page, 24);
        setAssets(data.assets);
        setPagination(data.pagination);
      } else {
        // No category, no search, no distance: standard listing with server-side filters.
        const data = await listAssets({
          page,
          limit: 24,
          minPrice: minPrice ? Number(minPrice) : undefined,
          maxPrice: maxPrice ? Number(maxPrice) : undefined,
          availabilityStatus: availability || undefined,
        });
        setAssets(data.assets);
        setPagination(data.pagination);
      }
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  // Note: center and userLocation are intentionally excluded from deps —
  // they are read via refs so geolocation resolving doesn't trigger extra
  // fetches when no distance filter is active.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, category, minPrice, maxPrice, availability, distance, page]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // Try a silent, best-effort geolocation on first load so the map centres
  // on the user without requiring them to press "My location" first.
  useEffect(() => {
    getBrowserLocation().then((loc) => {
      if (loc) {
        setCenter(loc);
        centerRef.current = loc;
      }
    });
  }, []);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    navigate({ search: { q: q.trim() || undefined, category: category || undefined } });
  };

  const clearFilters = () => {
    setCategory("");
    setMinPrice("");
    setMaxPrice("");
    setAvailability("");
    setDistance("");
    setPage(1);
    navigate({ search: { q: q.trim() || undefined, category: undefined } });
  };

  const useMyLocation = async () => {
    setLocating(true);
    setLocationNotice(null);
    setClickedPoint(null);
    const loc = await getBrowserLocation();
    setLocating(false);
    if (!loc) {
      setLocationNotice(
        "Couldn't access your location — check your browser's permission for this site and try again.",
      );
      return;
    }
    setUserLocation([loc.latitude, loc.longitude]);
    userLocationRef.current = [loc.latitude, loc.longitude];
    setCenter(loc);
    centerRef.current = loc;
    if (!distance) setDistance("25");
    setPage(1);
  };

  const handleMapClick = (lat: number, lng: number) => {
    setClickedPoint([lat, lng]);
  };

  const hasFilters = category || minPrice || maxPrice || availability || distance;
  const mapCenter: [number, number] = [center.latitude, center.longitude];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-extrabold tracking-tight">Browse items</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        See what's available on the map, then explore the full list below.
      </p>

      <form onSubmit={submitSearch} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <div className="card-elevated flex flex-1 items-center gap-2 rounded-full p-1.5">
          <SearchIcon className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search cameras, drills, books…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button type="submit" className="btn-primary shrink-0 px-4 py-2 text-sm">
            Search
          </button>
        </div>
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className="btn-outline px-4 py-2.5 text-sm"
        >
          <SlidersHorizontal className="h-4 w-4" /> Filters
          {hasFilters && <span className="ml-1 h-2 w-2 rounded-full bg-primary" />}
        </button>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="btn-outline px-4 py-2.5 text-sm"
          title="Use my location"
        >
          <LocateFixed className="h-4 w-4" /> {locating ? "Locating…" : "My location"}
        </button>
      </form>

      {showFilters && (
        <div className="card-elevated mt-4 grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">
              Category
            </label>
            <select
              className="input-base"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
                navigate({ search: { q: q.trim() || undefined, category: e.target.value || undefined } });
              }}
            >
              <option value="">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span>Distance</span>
              <span className="text-foreground">
                {distance ? `Within ${distance} km` : "Any distance"}
              </span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={5}
                max={50}
                step={5}
                value={distance ? Number(distance) : 5}
                onChange={(e) => {
                  setDistance(e.target.value);
                  setPage(1);
                }}
                className="w-full accent-primary"
              />
              {distance && (
                <button
                  type="button"
                  onClick={() => {
                    setDistance("");
                    setPage(1);
                  }}
                  className="shrink-0 text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="mt-0.5 flex justify-between text-[10px] text-muted-foreground">
              <span>5 km</span>
              <span>50 km</span>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">
              Min price (₹/day)
            </label>
            <input
              type="number"
              min="0"
              className="input-base"
              placeholder="0"
              value={minPrice}
              onChange={(e) => {
                setMinPrice(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">
              Max price (₹/day)
            </label>
            <input
              type="number"
              min="0"
              className="input-base"
              placeholder="5000"
              value={maxPrice}
              onChange={(e) => {
                setMaxPrice(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">
              Availability
            </label>
            <select
              className="input-base"
              value={availability}
              onChange={(e) => {
                setAvailability(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Any</option>
              <option value="AVAILABLE">Available</option>
              <option value="BOOKED">Booked</option>
            </select>
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="btn-outline px-4 py-2 text-xs lg:col-span-5 lg:justify-self-start"
            >
              <X className="h-3.5 w-3.5" /> Clear filters
            </button>
          )}
        </div>
      )}

      {locationNotice && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <span>{locationNotice}</span>
          <button
            type="button"
            onClick={() => setLocationNotice(null)}
            className="shrink-0 font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Map */}
      <div className="relative mt-5 overflow-hidden rounded-2xl border border-border shadow-(--shadow-card)">
        {MapView ? (
          <MapView
            center={mapCenter}
            assets={assets}
            userLocation={userLocation}
            clickedPoint={clickedPoint}
            radiusKm={distance ? Number(distance) : undefined}
            onMapClick={handleMapClick}
            onAssetClick={(id) => navigate({ to: "/assets/$assetId", params: { assetId: id } })}
          />
        ) : (
          <div className="flex h-[60vh] items-center justify-center bg-muted text-sm text-muted-foreground">
            Loading map…
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-muted px-3 py-1.5 font-medium text-muted-foreground">
          Map centre: {fmtCoord(center.latitude)}, {fmtCoord(center.longitude)}
        </span>
        {userLocation && (
          <span className="rounded-full bg-blue-500/10 px-3 py-1.5 font-medium text-blue-700">
            Your location: {fmtCoord(userLocation[0])}, {fmtCoord(userLocation[1])}
          </span>
        )}
        {clickedPoint && (
          <span className="rounded-full bg-amber-500/10 px-3 py-1.5 font-medium text-amber-700">
            Selected point: {fmtCoord(clickedPoint[0])}, {fmtCoord(clickedPoint[1])}
          </span>
        )}
        <span className="rounded-full bg-muted px-3 py-1.5 font-medium text-muted-foreground">
          Tap the map to see any point's coordinates
        </span>
      </div>

      {/* Results */}
      <div className="mt-6">
        {loading ? (
          <Loader label="Finding items…" />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchAssets} />
        ) : assets.length === 0 ? (
          <EmptyState
            title="No items found"
            description="Try widening your filters or searching for something else."
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {assets.map((a) => (
                <AssetCard key={a.id} asset={a} />
              ))}
            </div>
            {pagination && (
              <Pagination pagination={{ ...pagination, page }} onPageChange={setPage} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
