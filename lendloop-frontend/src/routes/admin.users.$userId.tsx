import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Ban, CheckCircle2, ShieldCheck, Star } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { getApiError } from "@/api/api";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Loader } from "@/components/Loader";
import { PresenceBadge } from "@/components/PresenceBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { getAdminUserDetail, setAdminUserStatus } from "@/services/adminService";
import { formatDate, formatPrice, initials, timeAgo } from "@/utils/format";
import type { AdminUserDetail } from "@/utils/types";

export const Route = createFileRoute("/admin/users/$userId")({
  head: () => ({ meta: [{ title: "User detail — Admin — ROL" }] }),
  component: AdminUserDetailPage,
});

type Tab = "profile" | "assets" | "given" | "taken" | "reviewsReceived" | "reviewsGiven" | "notifications";

const TABS: { id: Tab; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "assets", label: "Assets listed" },
  { id: "given", label: "Rentals given" },
  { id: "taken", label: "Rentals taken" },
  { id: "reviewsReceived", label: "Reviews received" },
  { id: "reviewsGiven", label: "Reviews given" },
  { id: "notifications", label: "Notifications" },
];

function AdminUserDetailPage() {
  const { userId } = Route.useParams();
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("profile");
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setDetail(await getAdminUserDetail(userId));
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleStatus = async () => {
    if (!detail) return;
    setUpdating(true);
    try {
      const updated = await setAdminUserStatus(userId, !detail.user.is_active);
      setDetail({ ...detail, user: { ...detail.user, ...updated } });
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <Loader full label="Loading user…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!detail) return null;

  const { user, assetsListed, rentalsGiven, rentalsTaken, reviewsReceived, reviewsGiven, recentNotifications, stats } = detail;

  return (
    <div>
      <Link to="/admin/users" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to users
      </Link>

      {/* Header */}
      <div className="card-elevated flex flex-wrap items-center gap-4 p-5">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-accent text-lg font-bold text-accent-foreground">
          {initials(user.full_name)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-extrabold">{user.full_name}</h1>
            {user.is_admin && (
              <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                <ShieldCheck className="h-3 w-3" /> Admin
              </span>
            )}
            <PresenceBadge presence={user.presence} />
          </div>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Member since {formatDate(user.created_at)} · Last active{" "}
            {user.last_seen ? timeAgo(user.last_seen) : "never"}
          </p>
        </div>
        <button
          onClick={toggleStatus}
          disabled={updating}
          className={user.is_active ? "btn-outline px-4 py-2 text-sm text-destructive" : "btn-primary px-4 py-2 text-sm"}
        >
          {user.is_active ? (
            <>
              <Ban className="h-4 w-4" /> Deactivate
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" /> Reactivate
            </>
          )}
        </button>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
        {[
          { label: "Trust score", value: user.trust_score },
          { label: "Avg. rating", value: Number(user.average_rating).toFixed(1) },
          { label: "Review count", value: stats.reviewCount },
          { label: "Items listed", value: stats.itemsListed },
          { label: "Items lent", value: stats.itemsLent },
          { label: "Items borrowed", value: stats.itemsBorrowed },
          { label: "Times rented", value: user.rentals_completed },
        ].map((s) => (
          <div key={s.label} className="card-elevated p-3 text-center">
            <p className="text-lg font-extrabold tabular-nums">{s.value}</p>
            <p className="text-[11px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors ${
              tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === "profile" && (
          <div className="card-elevated grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Phone" value={user.phone ?? "—"} />
            <Field label="City" value={[user.city, user.state, user.country].filter(Boolean).join(", ") || "—"} />
            <Field label="Verified" value={user.is_verified ? "Yes" : "No"} />
            <Field label="Account status" value={user.is_active ? "Active" : "Deactivated"} />
            <Field label="Total assets" value={String(user.total_assets)} />
            <Field label="Rentals taken" value={String(user.rentals_taken)} />
          </div>
        )}

        {tab === "assets" && (
          <ListOrEmpty items={assetsListed} emptyLabel="No assets listed yet.">
            {assetsListed.map((a) => (
              <Link
                key={a.id}
                to="/assets/$assetId"
                params={{ assetId: a.id }}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/30"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{a.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.category} · {formatPrice(a.expected_price_per_day)}/day · rented {a.usage_count}×
                  </p>
                </div>
                <StatusBadge status={a.availability_status} />
              </Link>
            ))}
          </ListOrEmpty>
        )}

        {tab === "given" && (
          <ListOrEmpty items={rentalsGiven} emptyLabel="This user hasn't lent anything yet.">
            {rentalsGiven.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">Rental #{r.id.slice(0, 8)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(r.start_date)} → {formatDate(r.end_date)} · {formatPrice(r.agreed_price ?? r.expected_price)}
                  </p>
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </ListOrEmpty>
        )}

        {tab === "taken" && (
          <ListOrEmpty items={rentalsTaken} emptyLabel="This user hasn't borrowed anything yet.">
            {rentalsTaken.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">Rental #{r.id.slice(0, 8)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(r.start_date)} → {formatDate(r.end_date)} · {formatPrice(r.agreed_price ?? r.expected_price)}
                  </p>
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </ListOrEmpty>
        )}

        {tab === "reviewsReceived" && (
          <ListOrEmpty items={reviewsReceived} emptyLabel="No reviews received yet.">
            {reviewsReceived.map((r) => (
              <div key={r.id} className="px-4 py-3">
                <div className="flex items-center gap-1 text-sm font-semibold">
                  <Star className="h-3.5 w-3.5 fill-current text-primary" /> {r.rating}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">{timeAgo(r.created_at)}</span>
                </div>
                {r.review && <p className="mt-1 text-sm text-muted-foreground">{r.review}</p>}
              </div>
            ))}
          </ListOrEmpty>
        )}

        {tab === "reviewsGiven" && (
          <ListOrEmpty items={reviewsGiven} emptyLabel="No reviews given yet.">
            {reviewsGiven.map((r) => (
              <div key={r.id} className="px-4 py-3">
                <div className="flex items-center gap-1 text-sm font-semibold">
                  <Star className="h-3.5 w-3.5 fill-current text-primary" /> {r.rating}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">{timeAgo(r.created_at)}</span>
                </div>
                {r.review && <p className="mt-1 text-sm text-muted-foreground">{r.review}</p>}
              </div>
            ))}
          </ListOrEmpty>
        )}

        {tab === "notifications" && (
          <ListOrEmpty items={recentNotifications} emptyLabel="No recent notifications.">
            {recentNotifications.map((n) => (
              <div key={n.id} className="px-4 py-3">
                <p className="text-sm font-semibold">{n.title}</p>
                <p className="text-xs text-muted-foreground">{n.message}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{timeAgo(n.created_at)}</p>
              </div>
            ))}
          </ListOrEmpty>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm">{value}</p>
    </div>
  );
}

function ListOrEmpty<T>({
  items,
  emptyLabel,
  children,
}: {
  items: T[];
  emptyLabel: string;
  children: React.ReactNode;
}) {
  if (items.length === 0) return <EmptyState title={emptyLabel} />;
  return <div className="card-elevated divide-y divide-border overflow-hidden">{children}</div>;
}
