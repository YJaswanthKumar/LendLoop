import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, Heart, Leaf, LogOut, Menu, Plus, ShieldCheck, User as UserIcon, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";
import { listNotifications } from "@/services/notificationService";
import { initials } from "@/utils/format";

export function Navbar() {
  const { user, isAuthenticated, hydrated, logout } = useAuth();
  const { wishlistedIds } = useWishlist();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchUnread = () => {
    if (!isAuthenticated) return;
    listNotifications({ isRead: false, limit: 1 })
      .then((d) => setUnread(d.pagination.totalItems))
      .catch(() => {});
  };

  useEffect(() => {
    if (!hydrated || !isAuthenticated) return;
    fetchUnread();
    intervalRef.current = setInterval(fetchUnread, 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, isAuthenticated]);

  useEffect(() => {
    const handler = () => fetchUnread();
    window.addEventListener("rol:notification-read", handler);
    window.addEventListener("lendloop:notification-read", handler); // backwards compat
    return () => {
      window.removeEventListener("rol:notification-read", handler);
      window.removeEventListener("lendloop:notification-read", handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    setOpen(false);
    navigate({ to: "/login", replace: true });
  };

  const navLink =
    "rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4">
        <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Leaf className="h-5 w-5" />
          </span>
          <span className="text-lg font-extrabold tracking-tight">ROL</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link
            to="/browse"
            className={navLink}
            activeProps={{ className: `${navLink} text-foreground` }}
          >
            Browse
          </Link>
          {isAuthenticated && (
            <>
              <Link to="/dashboard" className={navLink}>Dashboard</Link>
              <Link to="/requests" className={navLink}>Requests</Link>
              <Link to="/history" className={navLink}>Rentals</Link>
              {user?.is_admin && (
                <Link to="/admin" className={navLink}>Admin</Link>
              )}
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <Link
                to="/create-asset"
                className="btn-primary hidden px-4 py-2 text-sm md:inline-flex"
              >
                <Plus className="h-4 w-4" /> List an item
              </Link>
              <Link
                to="/wishlist"
                className="relative flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-muted"
                aria-label="Wishlist"
              >
                <Heart className="h-5 w-5" />
                {wishlistedIds.size > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                    {wishlistedIds.size > 9 ? "9+" : wishlistedIds.size}
                  </span>
                )}
              </Link>
              <Link
                to="/notifications"
                className="relative flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-muted"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unread > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
              <div className="relative hidden md:block">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground"
                  aria-label="Account menu"
                >
                  {initials(user?.full_name)}
                </button>
                {menuOpen && (
                  <div className="card-elevated absolute right-0 top-12 w-48 overflow-hidden py-1">
                    <Link
                      to="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted"
                    >
                      <UserIcon className="h-4 w-4" /> Profile
                    </Link>
                    {user?.is_admin && (
                      <Link
                        to="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted"
                      >
                        <ShieldCheck className="h-4 w-4" /> Admin portal
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-destructive hover:bg-muted"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link to="/login" className="btn-outline px-4 py-2 text-sm">Log in</Link>
              <Link to="/register" className="btn-primary px-4 py-2 text-sm">Sign up</Link>
            </div>
          )}
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border bg-background px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            <Link
              to="/browse"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted"
            >
              Browse items
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted">
                  Dashboard
                </Link>
                <Link to="/create-asset" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted">
                  List an item
                </Link>
                <Link to="/wishlist" onClick={() => setOpen(false)} className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted">
                  Wishlist
                  {wishlistedIds.size > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                      {wishlistedIds.size > 9 ? "9+" : wishlistedIds.size}
                    </span>
                  )}
                </Link>
                <Link to="/requests" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted">
                  Rental requests
                </Link>
                <Link to="/history" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted">
                  Rental history
                </Link>
                {user?.is_admin && (
                  <Link to="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted">
                    <ShieldCheck className="h-4 w-4" /> Admin portal
                  </Link>
                )}
                <Link to="/profile" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted">
                  Profile
                </Link>
                <button onClick={handleLogout} className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-destructive hover:bg-muted">
                  Sign out
                </button>
              </>
            ) : (
              <div className="mt-2 flex gap-2">
                <Link to="/login" onClick={() => setOpen(false)} className="btn-outline flex-1 px-4 py-2.5 text-sm">
                  Log in
                </Link>
                <Link to="/register" onClick={() => setOpen(false)} className="btn-primary flex-1 px-4 py-2.5 text-sm">
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
