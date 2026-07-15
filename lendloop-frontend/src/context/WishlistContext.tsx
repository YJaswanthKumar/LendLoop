import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { getApiError } from "@/api/api";
import { useAuth } from "@/context/AuthContext";
import { addToWishlist, getWishlistedAssetIds, removeFromWishlist } from "@/services/wishlistService";

interface WishlistContextValue {
  wishlistedIds: Set<string>;
  isWishlisted: (assetId: string) => boolean;
  toggle: (assetId: string) => Promise<void>;
  loading: boolean;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

/**
 * Loads the current user's wishlisted asset ids once after login, and keeps
 * them in memory so heart icons anywhere in the app (browse grid, asset
 * detail, dashboard…) render instantly without a request per card.
 * Toggling is optimistic: the heart flips immediately and only reverts if
 * the request actually fails.
 */
export function WishlistProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, hydrated } = useAuth();
  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) {
      setWishlistedIds(new Set());
      return;
    }
    setLoading(true);
    getWishlistedAssetIds()
      .then((ids) => setWishlistedIds(new Set(ids)))
      .catch(() => {
        // Non-fatal — heart icons just default to "not wishlisted" until retried.
      })
      .finally(() => setLoading(false));
  }, [hydrated, isAuthenticated]);

  const isWishlisted = useCallback((assetId: string) => wishlistedIds.has(assetId), [wishlistedIds]);

  const toggle = useCallback(
    async (assetId: string) => {
      if (pending.has(assetId)) return;

      const wasWishlisted = wishlistedIds.has(assetId);
      setPending((prev) => new Set(prev).add(assetId));
      setWishlistedIds((prev) => {
        const next = new Set(prev);
        if (wasWishlisted) next.delete(assetId);
        else next.add(assetId);
        return next;
      });

      try {
        if (wasWishlisted) {
          await removeFromWishlist(assetId);
        } else {
          await addToWishlist(assetId);
          toast.success("Added to wishlist");
        }
      } catch (err) {
        // Revert the optimistic update on failure.
        setWishlistedIds((prev) => {
          const next = new Set(prev);
          if (wasWishlisted) next.add(assetId);
          else next.delete(assetId);
          return next;
        });
        toast.error(getApiError(err));
      } finally {
        setPending((prev) => {
          const next = new Set(prev);
          next.delete(assetId);
          return next;
        });
      }
    },
    [wishlistedIds, pending],
  );

  const value = useMemo(
    () => ({ wishlistedIds, isWishlisted, toggle, loading }),
    [wishlistedIds, isWishlisted, toggle, loading],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside WishlistProvider");
  return ctx;
}
