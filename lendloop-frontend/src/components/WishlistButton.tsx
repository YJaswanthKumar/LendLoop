import { Heart } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";

/**
 * Heart toggle for wishlisting an asset. Safe to drop onto an <AssetCard/>
 * (stops the click from also navigating via the card's wrapping <Link/>) or
 * use standalone on the asset detail page.
 */
export function WishlistButton({
  assetId,
  isOwnAsset,
  size = "md",
  className = "",
}: {
  assetId: string;
  isOwnAsset?: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  const { isAuthenticated } = useAuth();
  const { isWishlisted, toggle } = useWishlist();
  const navigate = useNavigate();

  if (isOwnAsset) return null;

  const wishlisted = isWishlisted(assetId);
  const dims = size === "sm" ? "h-8 w-8" : "h-9 w-9";
  const iconDims = size === "sm" ? "h-4 w-4" : "h-4.5 w-4.5";

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.info("Log in to save items to your wishlist");
      navigate({ to: "/login" });
      return;
    }
    toggle(assetId);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={wishlisted}
      className={`flex ${dims} items-center justify-center rounded-full bg-background/90 shadow-sm backdrop-blur transition-transform hover:scale-105 ${className}`}
    >
      <Heart
        className={`${iconDims} transition-colors ${wishlisted ? "fill-red-500 text-red-500" : "text-foreground/70"}`}
      />
    </button>
  );
}
