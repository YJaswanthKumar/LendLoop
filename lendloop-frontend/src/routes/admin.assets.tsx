import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, EyeOff, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { getApiError } from "@/api/api";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Loader } from "@/components/Loader";
import { Pagination } from "@/components/Pagination";
import { StatusBadge } from "@/components/StatusBadge";
import { listAdminAssets, removeAdminAsset, setAdminAssetHidden } from "@/services/adminService";
import { formatDate, formatPrice } from "@/utils/format";
import { CATEGORIES, type AdminAsset, type PaginationInfo } from "@/utils/types";

export const Route = createFileRoute("/admin/assets")({
  head: () => ({ meta: [{ title: "Assets — Admin — ROL" }] }),
  component: AdminAssetsPage,
});

function AdminAssetsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [page, setPage] = useState(1);

  const [assets, setAssets] = useState<AdminAsset[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listAdminAssets({
        page,
        limit: 20,
        search: search || undefined,
        category: category || undefined,
        sortBy,
        sortDir: "desc",
      });
      setAssets(data.assets);
      setPagination(data.pagination);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [page, search, category, sortBy]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleHidden = async (asset: AdminAsset) => {
    setBusyId(asset.id);
    try {
      const updated = await setAdminAssetHidden(asset.id, !asset.admin_hidden);
      setAssets((prev) => prev.map((a) => (a.id === asset.id ? { ...a, ...updated } : a)));
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (asset: AdminAsset) => {
    if (!confirm(`Remove "${asset.title}"? This can't be undone from here.`)) return;
    setBusyId(asset.id);
    try {
      await removeAdminAsset(asset.id);
      setAssets((prev) => prev.filter((a) => a.id !== asset.id));
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Assets</h1>
      <p className="mt-1 text-sm text-muted-foreground">Moderate every listing on the platform.</p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <div className="card-elevated flex flex-1 items-center gap-2 rounded-full p-1.5">
          <Search className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by title, category or brand…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <select
          className="input-base sm:w-48"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select className="input-base sm:w-56" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="created_at">Sort: Recently added</option>
          <option value="usage_count">Sort: Most rented</option>
          <option value="average_rating">Sort: Top rated</option>
          <option value="expected_price_per_day">Sort: Price</option>
        </select>
      </div>

      <div className="mt-6">
        {loading ? (
          <Loader label="Loading assets…" />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : assets.length === 0 ? (
          <EmptyState title="No assets found" description="Try a different search or filter." />
        ) : (
          <>
            <div className="card-elevated overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/40 text-left text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Asset</th>
                      <th className="px-4 py-3">Owner</th>
                      <th className="px-4 py-3">Price/day</th>
                      <th className="px-4 py-3">Rented</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Listed</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {assets.map((a) => (
                      <tr key={a.id} className="transition-colors hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <Link to="/assets/$assetId" params={{ assetId: a.id }} className="font-medium hover:underline">
                            {a.title}
                          </Link>
                          <p className="text-xs text-muted-foreground">{a.category}</p>
                          {a.admin_hidden && (
                            <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                              Hidden by admin
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{a.owner?.full_name ?? "—"}</td>
                        <td className="px-4 py-3 tabular-nums">{formatPrice(a.expected_price_per_day)}</td>
                        <td className="px-4 py-3 tabular-nums">{a.usage_count}×</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={a.availability_status} />
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(a.created_at)}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => toggleHidden(a)}
                              disabled={busyId === a.id}
                              className="btn-outline h-8 w-8 p-0"
                              title={a.admin_hidden ? "Unhide listing" : "Hide listing"}
                            >
                              {a.admin_hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                            </button>
                            <button
                              onClick={() => remove(a)}
                              disabled={busyId === a.id}
                              className="btn-outline h-8 w-8 p-0 text-destructive"
                              title="Remove listing"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {pagination && <Pagination pagination={{ ...pagination, page }} onPageChange={setPage} />}
          </>
        )}
      </div>
    </div>
  );
}
