import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Boxes,
  CalendarPlus,
  CheckCircle2,
  Clock,
  Handshake,
  PackageCheck,
  Star,
  UserCheck,
  UserPlus,
  Users,
  Wifi,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getApiError } from "@/api/api";
import { ErrorState } from "@/components/ErrorState";
import { Loader } from "@/components/Loader";
import { StatCard } from "@/components/admin/StatCard";
import { getActivityFeed, getAdminAnalytics, getAdminOverview } from "@/services/adminService";
import { timeAgo } from "@/utils/format";
import type { ActivityLog, AdminAnalytics, AdminOverview } from "@/utils/types";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin overview — ROL" }] }),
  component: AdminOverviewPage,
});

function AdminOverviewPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ov, an, feed] = await Promise.all([
        getAdminOverview(),
        getAdminAnalytics(),
        getActivityFeed({ limit: 8 }),
      ]);
      setOverview(ov);
      setAnalytics(an);
      setActivity(feed.activities);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Loader full label="Loading admin dashboard…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!overview) return null;

  const growthData = (analytics?.rentalGrowthByDay ?? []).map((d) => ({
    day: d.date.slice(5),
    rentals: d.count,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Admin overview</h1>
        <p className="text-sm text-muted-foreground">Platform health at a glance.</p>
      </div>

      {/* User stats */}
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">Users</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard icon={Users} label="Total users" value={overview.totalUsers} tone="primary" />
          <StatCard icon={UserCheck} label="Active users" value={overview.activeUsers} />
          <StatCard icon={Wifi} label="Logged in now" value={overview.loggedInUsers} />
          <StatCard icon={UserPlus} label="New today" value={overview.newUsersToday} />
          <StatCard icon={CalendarPlus} label="New this week" value={overview.newUsersThisWeek} />
        </div>
      </section>

      {/* Asset & rental stats */}
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Assets &amp; rentals
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard icon={Boxes} label="Total assets" value={overview.totalAssets} tone="primary" />
          <StatCard icon={PackageCheck} label="Available" value={overview.availableAssets} />
          <StatCard icon={Handshake} label="Booked" value={overview.bookedAssets} />
          <StatCard icon={CheckCircle2} label="Completed rentals" value={overview.completedRentals} />
          <StatCard icon={Clock} label="Active rentals" value={overview.activeRentals} tone="warning" />
          <StatCard icon={AlertTriangle} label="Pending requests" value={overview.pendingRequests} tone="warning" />
        </div>
      </section>

      {/* Reviews & disputes */}
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Reviews &amp; trust
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard icon={Star} label="Total reviews" value={overview.totalReviews} />
          <StatCard icon={Star} label="Avg. platform rating" value={overview.averagePlatformRating.toFixed(1)} tone="primary" />
          <StatCard icon={AlertTriangle} label="Disputes (future-ready)" value={overview.totalDisputes} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Growth chart */}
        <div className="card-elevated p-4 lg:col-span-2">
          <h2 className="mb-3 text-sm font-bold">Rental growth — last 14 days</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
                <Tooltip />
                <Bar dataKey="rentals" fill="var(--color-primary, #16a34a)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity feed preview */}
        <div className="card-elevated p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold">Latest activity</h2>
            <Link to="/admin/activity" className="text-xs font-semibold text-primary hover:underline">
              View all
            </Link>
          </div>
          {activity.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <ul className="space-y-3">
              {activity.map((a) => (
                <li key={a.id} className="text-sm">
                  <p className="line-clamp-2">{a.message}</p>
                  <p className="text-[11px] text-muted-foreground">{timeAgo(a.created_at)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
