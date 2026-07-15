import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getApiError } from "@/api/api";
import { ErrorState } from "@/components/ErrorState";
import { Loader } from "@/components/Loader";
import { getAdminAnalytics } from "@/services/adminService";
import type { AdminAnalytics } from "@/utils/types";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Admin — LendLoop" }] }),
  component: AdminAnalyticsPage,
});

const PIE_COLORS = ["#16a34a", "#0ea5e9", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#6366f1"];

function AdminAnalyticsPage() {
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getAdminAnalytics());
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Loader full label="Crunching the numbers…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return null;

  const newUsers = data.newUsersByDay.map((d) => ({ day: d.date.slice(5), users: d.count }));
  const rentalGrowth = data.rentalGrowthByDay.map((d) => ({ day: d.date.slice(5), rentals: d.count }));
  const statusData = Object.entries(data.platformUsage).map(([status, count]) => ({ status, count }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">Trends and top performers across the platform.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card-elevated p-4">
          <h2 className="mb-3 text-sm font-bold">New users — last 14 days</h2>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={newUsers}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
                <Tooltip />
                <Line type="monotone" dataKey="users" stroke="#16a34a" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-elevated p-4">
          <h2 className="mb-3 text-sm font-bold">Rental growth — last 14 days</h2>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rentalGrowth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
                <Tooltip />
                <Bar dataKey="rentals" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-elevated p-4">
          <h2 className="mb-3 text-sm font-bold">Most rented categories</h2>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.mostRentedCategories}
                  dataKey="usage"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => entry.category}
                >
                  {data.mostRentedCategories.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-elevated p-4">
          <h2 className="mb-3 text-sm font-bold">Rentals by status</h2>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="status" tick={{ fontSize: 11 }} width={90} />
                <Tooltip />
                <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card-elevated p-4">
          <h2 className="mb-3 text-sm font-bold">Top rented assets</h2>
          <ol className="space-y-2 text-sm">
            {data.topRentedAssets.map((a, i) => (
              <li key={a.id} className="flex items-center justify-between gap-2">
                <span className="truncate">
                  <span className="mr-2 text-muted-foreground">{i + 1}.</span>
                  {a.title}
                </span>
                <span className="shrink-0 font-semibold tabular-nums">{a.usageCount}×</span>
              </li>
            ))}
            {data.topRentedAssets.length === 0 && <p className="text-muted-foreground">No data yet.</p>}
          </ol>
        </div>

        <div className="card-elevated p-4">
          <h2 className="mb-3 text-sm font-bold">Top owners</h2>
          <ol className="space-y-2 text-sm">
            {data.topOwners.map((o, i) => (
              <li key={o.userId} className="flex items-center justify-between gap-2">
                <span className="truncate">
                  <span className="mr-2 text-muted-foreground">{i + 1}.</span>
                  {o.name}
                </span>
                <span className="shrink-0 font-semibold tabular-nums">{o.assetsListed} listed</span>
              </li>
            ))}
            {data.topOwners.length === 0 && <p className="text-muted-foreground">No data yet.</p>}
          </ol>
        </div>

        <div className="card-elevated p-4">
          <h2 className="mb-3 text-sm font-bold">Most active borrowers</h2>
          <ol className="space-y-2 text-sm">
            {data.mostActiveBorrowers.map((b, i) => (
              <li key={b.userId} className="flex items-center justify-between gap-2">
                <span className="truncate">
                  <span className="mr-2 text-muted-foreground">{i + 1}.</span>
                  {b.name}
                </span>
                <span className="shrink-0 font-semibold tabular-nums">{b.rentalsMade} rentals</span>
              </li>
            ))}
            {data.mostActiveBorrowers.length === 0 && <p className="text-muted-foreground">No data yet.</p>}
          </ol>
        </div>
      </div>
    </div>
  );
}
