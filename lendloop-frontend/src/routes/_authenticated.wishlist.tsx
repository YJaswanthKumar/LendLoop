import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { AssetCard } from "@/components/AssetCard";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Loader } from "@/components/Loader";
import { Pagination } from "@/components/Pagination";
import { getApiError } from "@/api/api";
import { getWishlist } from "@/services/wishlistService";
import { useWishlist } from "@/context/WishlistContext";
import type { PaginationInfo, WishlistItem } from "@/utils/types";

export const Route = createFileRoute("/_authenticated/wishlist")({
  head: () => ({
    meta: [{ title: "Wishlist — ROL" }],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const { wishlistedIds } = useWishlist();
  const [assets, setAssets] = useState<WishlistItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWishlist = () => {
    setLoading(true);
    setError(null);
    getWishlist({ page, limit: 12 })
      .then((res) => {
        setAssets(res.assets);
        setPagination(res.pagination);
      })
      .catch((err) => setError(getApiError(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchWishlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Re-fetch the page whenever a heart is toggled elsewhere in the app
  // (e.g. removed from an asset's detail page) so this list stays in sync.
  useEffect(() => {
    fetchWishlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wishlistedIds.size]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
          <Heart className="h-5 w-5 fill-red-500 text-red-500" />
        </span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Your wishlist</h1>
          <p className="text-sm text-muted-foreground">Items you've saved for later.</p>
        </div>
      </div>

      <div className="mt-6">
        {loading ? (
          <Loader label="Loading your wishlist…" />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchWishlist} />
        ) : assets.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Nothing saved yet"
            description="Tap the heart icon on any listing to save it here for later."
            action={
              <Link to="/browse" className="btn-primary px-4 py-2 text-sm">
                Browse items
              </Link>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {assets.map((a) => (
                <AssetCard key={a.id} asset={a} />
              ))}
            </div>
            {pagination && <Pagination pagination={{ ...pagination, page }} onPageChange={setPage} />}
          </>
        )}
      </div>
    </div>
  );
}
