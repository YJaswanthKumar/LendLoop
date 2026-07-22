import { Link } from "@tanstack/react-router";
import { Leaf } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Leaf className="h-4 w-4" />
            </span>
            <span className="font-extrabold tracking-tight">ROL</span>
          </div>
          <p className="mt-1 text-xs font-medium text-muted-foreground">Rent or Lend</p>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Get anything from neighbours near you. Earn from your own things gathering dust at home.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-bold">Explore</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/browse" className="hover:text-foreground">Browse items</Link>
            </li>
            <li>
              <Link to="/create-asset" className="hover:text-foreground">List an item</Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold">Account</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/login" className="hover:text-foreground">Log in</Link>
            </li>
            <li>
              <Link to="/register" className="hover:text-foreground">Sign up</Link>
            </li>
            <li>
              <Link to="/dashboard" className="hover:text-foreground">Dashboard</Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold">Trust & Safety</h3>
          <p className="mt-3 text-sm text-muted-foreground">
            Every member has a trust score built from real, completed rentals and reviews.
          </p>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} ROL — Rent or Lend. Share more, own less.
      </div>
    </footer>
  );
}
