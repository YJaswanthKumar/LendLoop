import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  Boxes,
  Handshake,
  LayoutDashboard,
  Menu,
  ShieldAlert,
  Star,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { Loader } from "@/components/Loader";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/admin")({
  ssr: false,
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/users", label: "Users", icon: Users, exact: false },
  { to: "/admin/assets", label: "Assets", icon: Boxes, exact: false },
  { to: "/admin/rentals", label: "Rentals", icon: Handshake, exact: false },
  { to: "/admin/reviews", label: "Reviews", icon: Star, exact: false },
  { to: "/admin/activity", label: "Activity feed", icon: Activity, exact: false },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3, exact: false },
] as const;

function AdminLayout() {
  const { hydrated, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!hydrated) return <Loader full label="Checking your session…" />;

  if (!isAuthenticated) {
    navigate({ to: "/login", replace: true });
    return <Loader full label="Redirecting…" />;
  }

  if (!user?.is_admin) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-3 px-4 text-center">
        <ShieldAlert className="h-10 w-10 text-destructive" />
        <h1 className="text-xl font-bold">Admin access required</h1>
        <p className="text-sm text-muted-foreground">
          Your account doesn't have permission to view the admin portal.
        </p>
        <Link to="/" className="btn-primary mt-2 px-5 py-2 text-sm">
          Back to LendLoop
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl gap-6 px-4 py-6">
      {/* Mobile top bar */}
      <button
        onClick={() => setMobileOpen(true)}
        className="btn-outline fixed bottom-4 right-4 z-30 h-12 w-12 rounded-full p-0 shadow-lg lg:hidden"
        aria-label="Open admin menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Sidebar (desktop: static, mobile: drawer) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 shrink-0 transform border-r border-border bg-background p-4 transition-transform lg:static lg:z-auto lg:translate-x-0 lg:border-0 lg:bg-transparent lg:p-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-4 flex items-center justify-between lg:hidden">
          <span className="text-sm font-bold">Admin menu</span>
          <button onClick={() => setMobileOpen(false)} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="card-elevated sticky top-20 p-3">
          <div className="mb-2 px-2 py-1">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Admin portal</p>
          </div>
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => {
              const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Content */}
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
