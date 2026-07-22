import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, HandCoins, MapPin, Search, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import heroImg from "@/assets/hero.jpg";
import { AssetCard } from "@/components/AssetCard";
import { Loader } from "@/components/Loader";
import { listAssets } from "@/services/assetService";
import type { Asset } from "@/utils/types";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

const POPULAR = ["Electronics", "Cameras", "Laptops", "Tools", "Books", "Sports Equipment"];

function LandingPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [featured, setFeatured] = useState<Asset[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listAssets({ limit: 8, availabilityStatus: "AVAILABLE" })
      .then((d) => setFeatured(d.assets))
      .catch(() => setFeatured(null))
      .finally(() => setLoading(false));
  }, []);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/browse", search: { q: q.trim() || undefined, category: undefined } });
  };

  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 pt-10 sm:pt-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">
              <Sparkles className="h-3.5 w-3.5" /> Community-powered rentals
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Get anything.
              <br />
              <span className="text-primary">Earn from your own things.</span>
            </h1>
            <p className="mt-4 max-w-md text-muted-foreground">
              Why buy something you'll use twice? Borrow it from a neighbour for almost nothing —
              or list what you own and let it pay for itself.
            </p>
            <form
              onSubmit={onSearch}
              className="card-elevated mt-6 flex items-center gap-2 rounded-full p-2"
            >
              <Search className="ml-3 h-5 w-5 shrink-0 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={'What do you need? Try \u201ccamera\u201d\u2026'}
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <button type="submit" className="btn-primary shrink-0 px-5 py-2.5 text-sm">
                Search
              </button>
            </form>
            <div className="mt-4 flex flex-wrap gap-2">
              {POPULAR.map((c) => (
                <Link
                  key={c}
                  to="/browse"
                  search={{ q: undefined, category: c }}
                  className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {c}
                </Link>
              ))}
            </div>
          </div>
          <div className="overflow-hidden rounded-3xl shadow-(--shadow-card-hover)">
            <img
              src={heroImg}
              alt="Neighbours sharing items — a camera being handed over at a doorstep"
              width={1600}
              height={1000}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">Available near you</h2>
            <p className="text-sm text-muted-foreground">Fresh listings from your community</p>
          </div>
          <Link to="/browse" className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {loading ? (
          <Loader label="Loading listings…" />
        ) : featured && featured.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:grid-cols-4">
            {featured.map((a) => (
              <AssetCard key={a.id} asset={a} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border py-14 text-center text-sm text-muted-foreground">
            No listings yet — be the first to{" "}
            <Link to="/create-asset" className="font-semibold text-primary hover:underline">
              list an item
            </Link>
            .
          </div>
        )}
      </section>

      {/* Why ROL */}
      <section className="border-t border-border bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <h2 className="text-center text-2xl font-extrabold tracking-tight">Why Rent or Lend?</h2>
          <p className="mx-auto mt-2 max-w-lg text-center text-sm text-muted-foreground">
            Stop buying things you only need once. Stop letting valuable stuff collect dust.
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: MapPin,
                title: "Get anything, nearby",
                text: "Find items minutes away. Borrow a drill, a camera, or camping gear from a neighbour — not a store.",
              },
              {
                icon: HandCoins,
                title: "Earn from your own things",
                text: "Your idle camera, power tools, or bike can pay you back. List once, earn every time someone needs it.",
              },
              {
                icon: ShieldCheck,
                title: "Built on trust",
                text: "Ratings, reviews and trust scores from real completed rentals keep every transaction honest.",
              },
            ].map((f) => (
              <div key={f.title} className="card-elevated p-6 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <f.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 font-bold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link to="/register" className="btn-primary px-8 py-3 text-sm">
              Join ROL — it's free
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
