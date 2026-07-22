import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { getApiError } from "@/api/api";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Loader } from "@/components/Loader";
import { Pagination } from "@/components/Pagination";
import { listNotifications, markNotificationRead } from "@/services/notificationService";
import { timeAgo } from "@/utils/format";
import { notificationRoute } from "@/utils/notificationRoute";
import type { AppNotification, PaginationInfo } from "@/utils/types";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — ROL" },
      { name: "description", content: "Your ROL notifications: requests, offers and rental updates." },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    listNotifications({ page, limit: 15 })
      .then((d) => {
        setNotifications(d.notifications);
        setPagination(d.pagination);
      })
      .catch((err) => setError(getApiError(err)))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(load, [load]);

  const handleNotificationClick = async (n: AppNotification) => {
    if (busyId) return;
    if (!n.is_read) {
      setBusyId(n.id);
      try {
        await markNotificationRead(n.id);
        setNotifications((list) =>
          list.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)),
        );
        window.dispatchEvent(new CustomEvent("lendloop:notification-read"));
      } catch (err) {
        toast.error(getApiError(err));
        setBusyId(null);
        return;
      }
      setBusyId(null);
    }
    const dest = notificationRoute(n.type);
    if (dest) navigate({ to: dest.to as never, search: dest.search });
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-extrabold tracking-tight">Notifications</h1>
      <p className="mt-1 text-sm text-muted-foreground">Requests, offers and rental updates.</p>

      <div className="mt-6">
        {loading ? (
          <Loader label="Loading notifications…" />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : notifications.length === 0 ? (
          <EmptyState icon={Bell} title="No notifications" description="You're all caught up!" />
        ) : (
          <div className="card-elevated divide-y divide-border">
            {notifications.map((n) => {
              const hasLink = notificationRoute(n.type) !== null;
              return (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={[
                    "flex gap-3 px-4 py-4 transition-colors",
                    n.is_read ? "opacity-70" : "",
                    hasLink || !n.is_read ? "cursor-pointer hover:bg-muted/50" : "",
                    busyId === n.id ? "pointer-events-none opacity-50" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <span
                    className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${n.is_read ? "bg-muted-foreground/30" : "bg-primary"}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{n.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{timeAgo(n.created_at)}</p>
                    {hasLink && (
                      <p className="mt-1 text-xs font-medium text-primary">
                        {!n.is_read ? "Click to mark read and go →" : "Click to go →"}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {pagination && <Pagination pagination={{ ...pagination, page }} onPageChange={setPage} />}
      </div>
    </div>
  );
}
