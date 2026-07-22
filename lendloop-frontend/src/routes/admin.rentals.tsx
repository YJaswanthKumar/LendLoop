import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { getApiError } from "@/api/api";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Loader } from "@/components/Loader";
import { Pagination } from "@/components/Pagination";
import { StatusBadge } from "@/components/StatusBadge";
import { listAdminRentals } from "@/services/adminService";
import { formatDate, formatPrice } from "@/utils/format";
import type { AdminRental, PaginationInfo, RentalStatus } from "@/utils/types";

export const Route = createFileRoute("/admin/rentals")({
  head: () => ({ meta: [{ title: "Rentals — Admin — ROL" }] }),
  component: AdminRentalsPage,
});

const STATUSES: RentalStatus[] = [
  "REQUESTED",
  "NEGOTIATING",
  "ACCEPTED",
  "ACTIVE",
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
];

function AdminRentalsPage() {
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [rentals, setRentals] = useState<AdminRental[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listAdminRentals({ page, limit: 20, status: status || undefined, search: search || undefined });
      setRentals(data.rentals);
      setPagination(data.pagination);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [page, status, search]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Rentals</h1>
      <p className="mt-1 text-sm text-muted-foreground">Every rental transaction on the platform, searchable.</p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <div className="card-elevated flex flex-1 items-center gap-2 rounded-full p-1.5">
          <Search className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by asset or user name…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <select
          className="input-base sm:w-48"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6">
        {loading ? (
          <Loader label="Loading rentals…" />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : rentals.length === 0 ? (
          <EmptyState title="No rentals found" description="Try a different search or filter." />
        ) : (
          <>
            <div className="card-elevated overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/40 text-left text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Asset</th>
                      <th className="px-4 py-3">Owner</th>
                      <th className="px-4 py-3">Borrower</th>
                      <th className="px-4 py-3">Pickup</th>
                      <th className="px-4 py-3">Return</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {rentals.map((r) => (
                      <tr key={r.id} className="transition-colors hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{r.asset?.title ?? "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{r.owner?.full_name ?? "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{r.borrower?.full_name ?? "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(r.start_date)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(r.end_date)}</td>
                        <td className="px-4 py-3 tabular-nums">
                          {formatPrice(r.agreed_price ?? r.offered_price ?? r.expected_price)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={r.status} />
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
