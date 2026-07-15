import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  Bell,
  Boxes,
  Handshake,
  Star,
  Trash2,
  UserPlus,
  Wifi,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { getApiError } from "@/api/api";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Loader } from "@/components/Loader";
import { Pagination } from "@/components/Pagination";
import { getActivityFeed } from "@/services/adminService";
import { formatDate, timeAgo } from "@/utils/format";
import type { ActivityLog, PaginationInfo } from "@/utils/types";

export const Route = createFileRoute("/admin/activity")({
  head: () => ({ meta: [{ title: "Activity feed — Admin — LendLoop" }] }),
  component: AdminActivityPage,
});

const TYPE_META: Record<string, { icon: typeof Activity; label: string }> = {
  USER_REGISTERED: { icon: UserPlus, label: "User registered" },
  USER_LOGIN: { icon: Wifi, label: "User logged in" },
  ASSET_LISTED: { icon: Boxes, label: "Asset listed" },
  ASSET_UPDATED: { icon: Boxes, label: "Asset updated" },
  ASSET_DELETED: { icon: Trash2, label: "Asset deleted" },
  RENTAL_REQUESTED: { icon: Handshake, label: "Rental requested" },
  RENTAL_APPROVED: { icon: Handshake, label: "Rental approved" },
  RENTAL_COMPLETED: { icon: Handshake, label: "Rental completed" },
  REVIEW_SUBMITTED: { icon: Star, label: "Review submitted" },
  NOTIFICATION_SENT: { icon: Bell, label: "Notification sent" },
};

function AdminActivityPage() {
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);

  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getActivityFeed({ page, limit: 25, type: type || undefined });
      setActivities(data.activities);
      setPagination(data.pagination);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [page, type]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Platform activity feed</h1>
      <p className="mt-1 text-sm text-muted-foreground">Real-time-ish log of everything happening on LendLoop, newest first.</p>

      <div className="mt-4">
        <select
          className="input-base sm:w-64"
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All event types</option>
          {Object.entries(TYPE_META).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6">
        {loading ? (
          <Loader label="Loading activity…" />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : activities.length === 0 ? (
          <EmptyState icon={Activity} title="No activity yet" description="Platform events will appear here as they happen." />
        ) : (
          <>
            <div className="card-elevated divide-y divide-border overflow-hidden">
              {activities.map((a) => {
                const meta = TYPE_META[a.type] ?? { icon: Activity, label: a.type };
                const Icon = meta.icon;
                return (
                  <div key={a.id} className="flex items-start gap-3 px-4 py-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                      <Icon className="h-4 w-4 text-primary" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">{a.message}</p>
                      <p className="text-[11px] text-muted-foreground" title={formatDate(a.created_at)}>
                        {timeAgo(a.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            {pagination && <Pagination pagination={{ ...pagination, page }} onPageChange={setPage} />}
          </>
        )}
      </div>
    </div>
  );
}
