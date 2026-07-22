import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { getApiError } from "@/api/api";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Loader } from "@/components/Loader";
import { Pagination } from "@/components/Pagination";
import { PresenceBadge } from "@/components/PresenceBadge";
import { listAdminUsers } from "@/services/adminService";
import { formatDate, initials, timeAgo } from "@/utils/format";
import type { AdminUser, PaginationInfo } from "@/utils/types";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "Users — Admin — ROL" }] }),
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [isActive, setIsActive] = useState<"" | "true" | "false">("");
  const [sortBy, setSortBy] = useState("created_at");
  const [page, setPage] = useState(1);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listAdminUsers({
        page,
        limit: 20,
        search: search || undefined,
        isActive: isActive || undefined,
        sortBy,
        sortDir: "desc",
      });
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [page, search, isActive, sortBy]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Users</h1>
      <p className="mt-1 text-sm text-muted-foreground">Search, filter and manage every ROL account.</p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <div className="card-elevated flex flex-1 items-center gap-2 rounded-full p-1.5">
          <Search className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name or email…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <select
          className="input-base sm:w-48"
          value={isActive}
          onChange={(e) => {
            setIsActive(e.target.value as "" | "true" | "false");
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Deactivated</option>
        </select>
        <select
          className="input-base sm:w-56"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="created_at">Sort: Newest</option>
          <option value="full_name">Sort: Name</option>
          <option value="trust_score">Sort: Trust score</option>
          <option value="average_rating">Sort: Rating</option>
          <option value="rentals_completed">Sort: Rentals completed</option>
          <option value="last_seen">Sort: Last active</option>
        </select>
      </div>

      <div className="mt-6">
        {loading ? (
          <Loader label="Loading users…" />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : users.length === 0 ? (
          <EmptyState title="No users found" description="Try a different search or filter." />
        ) : (
          <>
            <div className="card-elevated overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/40 text-left text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Presence</th>
                      <th className="px-4 py-3">Trust score</th>
                      <th className="px-4 py-3">Rating</th>
                      <th className="px-4 py-3">Assets</th>
                      <th className="px-4 py-3">Joined</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {users.map((u) => (
                      <tr key={u.id} className="transition-colors hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <Link
                            to="/admin/users/$userId"
                            params={{ userId: u.id }}
                            className="flex items-center gap-3 font-medium hover:underline"
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                              {initials(u.full_name)}
                            </span>
                            <span>
                              <span className="flex items-center gap-1.5">
                                {u.full_name}
                                {u.is_admin && <ShieldCheck className="h-3.5 w-3.5 text-primary" />}
                              </span>
                              <span className="block text-xs text-muted-foreground">{u.email}</span>
                            </span>
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <PresenceBadge presence={u.presence} />
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {u.last_seen ? timeAgo(u.last_seen) : "never"}
                          </p>
                        </td>
                        <td className="px-4 py-3 tabular-nums">{u.trust_score}</td>
                        <td className="px-4 py-3 tabular-nums">{Number(u.average_rating).toFixed(1)}</td>
                        <td className="px-4 py-3 tabular-nums">{u.total_assets}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(u.created_at)}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                              u.is_active ? "bg-accent text-accent-foreground" : "bg-red-100 text-red-700"
                            }`}
                          >
                            {u.is_active ? "Active" : "Deactivated"}
                          </span>
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
