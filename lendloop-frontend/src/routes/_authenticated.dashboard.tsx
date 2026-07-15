import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  Boxes,
  Clock,
  HandCoins,
  Plus,
  ShieldCheck,
  Star,
  TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { getApiError } from "@/api/api";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Loader } from "@/components/Loader";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/context/AuthContext";
import { listAssets } from "@/services/assetService";
import { getOverview, getRecentRentals } from "@/services/dashboardService";
import { listNotifications, markNotificationRead } from "@/services/notificationService";
import { notificationRoute } from "@/utils/notificationRoute";
import { formatPrice, timeAgo } from "@/utils/format";
import { enrichRentalsWithAssets } from "@/utils/enrichRentals";
import type { AppNotification, Asset, DashboardOverview, Rental } from "@/utils/types";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — LendLoop" },
      { name: "description", content: "Your LendLoop overview: assets, rentals, requests and notifications." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [myAssets, setMyAssets] = useState<Asset[]>([]);
  const [recent, setRecent] = useState<Rental[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [ov, assetsRes, recentRes, notifRes] = await Promise.all([
        getOverview(),
        listAssets({ limit: 100 }),
        getRecentRentals(5),
        listNotifications({ limit: 5 }),
      ]);
      setOverview(ov);
      setMyAssets(assetsRes.assets.filter((a) => a.owner_id === user.id));
      setRecent(await enrichRentalsWithAssets(recentRes));
      setNotifications(notifRes.notifications);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  // Re-fetch notification count when a notification is marked read elsewhere
  // (e.g. from the notifications page in another tab or after navigation).
  useEffect(() => {
    const handler = () => {
      listNotifications({ limit: 5 })
        .then((d) => setNotifications(d.notifications))
        .catch(() => {});
    };
    window.addEventListener("lendloop:notification-read", handler);
    return () => window.removeEventListener("lendloop:notification-read", handler);
  }, []);

  if (loading) return <Loader full label="Loading your dashboard…" />;
  if (error)
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <ErrorState message={error} onRetry={load} />
      </div>
    );

  const stats = [
    { icon: Boxes, label: "Assets listed", value: overview?.totalAssets ?? 0 },
    { icon: HandCoins, label: "Rentals completed", value: overview?.rentalsCompleted ?? 0 },
    { icon: Clock, label: "Rentals in progress", value: overview?.activeRentals ?? 0 },
    { icon: TrendingUp, label: "Requests awaiting response", value: overview?.pendingRequests ?? 0 },
    { icon: ShieldCheck, label: "Trust score", value: overview?.trustScore ?? 0 },
    {
      icon: Star,
      label: "Avg. rating",
      value: overview?.averageRating ? Number(overview.averageRating).toFixed(1) : "—",
    },
  ];

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleNotifClick = (n: AppNotification) => {
    // Mark as read fire-and-forget — don't block navigation
    if (!n.is_read) {
      markNotificationRead(n.id)
        .then(() => {
          setNotifications((prev) =>
            prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)),
          );
          window.dispatchEvent(new CustomEvent("lendloop:notification-read"));
        })
        .catch(() => {});
    }
    const dest = notificationRoute(n.type);
    if (dest) {
      navigate({ to: dest.to as never, search: dest.search });
    } else {
      navigate({ to: "/notifications" });
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Welcome back, {user?.full_name?.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-muted-foreground">Here's what's happening with your items.</p>
        </div>
        <Link to="/create-asset" className="btn-primary px-5 py-2.5 text-sm">
          <Plus className="h-4 w-4" /> List an item
        </Link>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <div key={s.label} className="card-elevated p-4">
            <s.icon className="h-5 w-5 text-primary" />
            <p className="mt-2 text-2xl font-extrabold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* My assets */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">My assets</h2>
            <Link to="/create-asset" className="text-sm font-semibold text-primary hover:underline">
              + Add new
            </Link>
          </div>
          {myAssets.length === 0 ? (
            <EmptyState
              title="No assets yet"
              description="List your first item and start earning."
              action={
                <Link to="/create-asset" className="btn-primary px-5 py-2 text-sm">
                  List an item
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {myAssets.slice(0, 6).map((a) => (
                <div key={a.id} className="card-elevated flex items-center gap-4 p-3">
                  <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {a.image_url ? (
                      <img src={a.image_url} alt={a.title} loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-black text-muted-foreground/30">
                        {a.category?.[0]}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      to="/assets/$assetId"
                      params={{ assetId: a.id }}
                      className="line-clamp-1 text-sm font-semibold hover:underline"
                    >
                      {a.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {formatPrice(a.expected_price_per_day)}/day · rented {a.usage_count}×
                    </p>
                  </div>
                  <StatusBadge status={a.availability_status} />
                  <Link
                    to="/edit-asset/$assetId"
                    params={{ assetId: a.id }}
                    className="btn-outline shrink-0 px-3 py-1.5 text-xs"
                  >
                    Edit
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* Recent activity */}
          <h2 className="mb-3 mt-8 text-lg font-bold">Recent activity</h2>
          {recent.length === 0 ? (
            <EmptyState title="No rental activity yet" description="Requests and rentals will appear here." />
          ) : (
            <div className="card-elevated divide-y divide-border">
              {recent.map((r) => (
                <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                  <StatusBadge status={r.status} />
                  <p className="min-w-0 flex-1 truncate text-sm">
                    {r.asset?.title ?? "Item"} ·{" "}
                    <span className="text-muted-foreground">
                      {formatPrice(r.agreed_price ?? r.offered_price ?? r.expected_price)}
                    </span>
                  </p>
                  <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(r.updated_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              Notifications
              {unreadCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                  {unreadCount}
                </span>
              )}
            </h2>
            <Link to="/notifications" className="text-sm font-semibold text-primary hover:underline">
              View all
            </Link>
          </div>
          {notifications.length === 0 ? (
            <EmptyState icon={Bell} title="All caught up" description="No notifications right now." />
          ) : (
            <div className="card-elevated divide-y divide-border overflow-hidden">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleNotifClick(n)}
                  onKeyDown={(e) => e.key === "Enter" && handleNotifClick(n)}
                  className="cursor-pointer px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    {!n.is_read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                    <p className="truncate text-sm font-semibold">{n.title}</p>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">{timeAgo(n.created_at)}</p>
                </div>
              ))}
              <div
                role="button"
                tabIndex={0}
                onClick={() => navigate({ to: "/notifications" })}
                onKeyDown={(e) => e.key === "Enter" && navigate({ to: "/notifications" })}
                className="cursor-pointer px-4 py-2.5 text-center text-xs font-semibold text-primary transition-colors hover:bg-muted/50"
              >
                See all notifications →
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
