import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SlidersHorizontal, Search as SearchIcon, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AssetCard } from "@/components/AssetCard";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Loader } from "@/components/Loader";
import { Pagination } from "@/components/Pagination";
import { getApiError } from "@/api/api";
import { listAssets, nearbyAssets, searchAssets } from "@/services/assetService";
import { getBrowserLocation } from "@/utils/locationUtils";
import { CATEGORIES, type Asset, type PaginationInfo } from "@/utils/types";

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
      { name: "description", content: "Search and filter rentable items near you: electronics, tools, cameras, books and more." },
      { property: "og:title", content: "Browse items — LendLoop" },
      { property: "og:description", content: "Find rentable items in your community." },
    ],
  }),
  component: BrowsePage,
});

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
        const loc = await getBrowserLocation();
        if (!loc) {
          setError("Location access is needed for the distance filter. Allow location and retry.");
          setLoading(false);
          return;
        }
        const data = await nearbyAssets(loc.latitude, loc.longitude, Number(distance), page, 12);
        let list = data.assets;
        if (category) list = list.filter((a) => a.category.toLowerCase() === category.toLowerCase());
        if (minPrice) list = list.filter((a) => a.expected_price_per_day >= Number(minPrice));
        if (maxPrice) list = list.filter((a) => a.expected_price_per_day <= Number(maxPrice));
        if (q) list = list.filter((a) => a.title.toLowerCase().includes(q.toLowerCase()));
        setAssets(list);
        setPagination(data.pagination);
      } else if (q.trim()) {
        const data = await searchAssets(q.trim(), page, 12);
        let list = data.assets;
        if (category) list = list.filter((a) => a.category.toLowerCase() === category.toLowerCase());
        setAssets(list);
        setPagination(data.pagination);
      } else {
        const data = await listAssets({
          page,
          limit: 12,
          category: category || undefined,
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
  }, [q, category, minPrice, maxPrice, availability, distance, page]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

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

  const hasFilters = category || minPrice || maxPrice || availability || distance;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-extrabold tracking-tight">Browse items</h1>

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
      </form>

      {showFilters && (
        <div className="card-elevated mt-4 grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Category</label>
            <select className="input-base" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
              <option value="">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Distance</label>
            <select className="input-base" value={distance} onChange={(e) => { setDistance(e.target.value); setPage(1); }}>
              <option value="">Any distance</option>
              <option value="5">Within 5 km</option>
              <option value="10">Within 10 km</option>
              <option value="25">Within 25 km</option>
              <option value="50">Within 50 km</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Min price (₹/day)</label>
            <input type="number" min="0" className="input-base" placeholder="0" value={minPrice} onChange={(e) => { setMinPrice(e.target.value); setPage(1); }} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Max price (₹/day)</label>
            <input type="number" min="0" className="input-base" placeholder="5000" value={maxPrice} onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Availability</label>
            <select className="input-base" value={availability} onChange={(e) => { setAvailability(e.target.value); setPage(1); }}>
              <option value="">Any</option>
              <option value="AVAILABLE">Available</option>
              <option value="BOOKED">Booked</option>
            </select>
          </div>
          {hasFilters && (
            <button onClick={clearFilters} className="btn-outline px-4 py-2 text-xs lg:col-span-5 lg:justify-self-start">
              <X className="h-3.5 w-3.5" /> Clear filters
            </button>
          )}
        </div>
      )}

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
            {pagination && <Pagination pagination={{ ...pagination, page }} onPageChange={setPage} />}
          </>
        )}
      </div>
    </div>
  );
}
