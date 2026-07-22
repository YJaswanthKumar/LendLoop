import { Link } from "@tanstack/react-router";
import { MapPin, Star } from "lucide-react";
import type { Asset } from "@/utils/types";
import { formatPrice } from "@/utils/format";
import { StatusBadge } from "./StatusBadge";
import { WishlistButton } from "./WishlistButton";
import { useAuth } from "@/context/AuthContext";

export function AssetCard({ asset }: { asset: Asset }) {
  const { user } = useAuth();
  return (
    <Link
      to="/assets/$assetId"
      params={{ assetId: asset.id }}
      className="card-elevated group flex flex-col overflow-hidden transition-shadow hover:shadow-(--shadow-card-hover)"
    >
      {/* Image — square on mobile, 4:3 on sm+ */}
      <div className="relative aspect-square overflow-hidden bg-muted sm:aspect-[4/3]">
        {asset.image_url ? (
          <img
            src={asset.image_url}
            alt={asset.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl font-black text-muted-foreground/30">
            {asset.category?.[0] ?? "?"}
          </div>
        )}
        <div className="absolute left-2 top-2 sm:left-3 sm:top-3">
          <StatusBadge status={asset.availability_status} />
        </div>
        <div className="absolute right-2 top-2 sm:right-3 sm:top-3">
          <WishlistButton assetId={asset.id} isOwnAsset={user?.id === asset.owner_id} size="sm" />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <div className="flex items-start justify-between gap-1.5">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug sm:line-clamp-1 sm:text-base">
            {asset.title}
          </h3>
          {asset.average_rating > 0 && (
            <span className="flex shrink-0 items-center gap-0.5 text-xs text-muted-foreground sm:gap-1 sm:text-sm">
              <Star className="h-3 w-3 fill-current text-primary sm:h-3.5 sm:w-3.5" />
              {Number(asset.average_rating).toFixed(1)}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
          {asset.category}
        </p>
        {(asset.city || asset.distance_km != null) && (
          <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground sm:text-xs">
            <MapPin className="h-2.5 w-2.5 shrink-0 sm:h-3 sm:w-3" />
            <span className="truncate">
              {asset.distance_km != null && Number(asset.distance_km) >= 0.1
                ? `${Number(asset.distance_km).toFixed(1)} km away`
                : (asset.city ?? "Nearby")}
            </span>
          </div>
        )}
        <div className="mt-auto pt-2.5 flex items-baseline justify-between">
          <p className="text-sm font-bold sm:text-base">
            {formatPrice(asset.expected_price_per_day)}
            <span className="text-[10px] font-normal text-muted-foreground sm:text-xs"> / day</span>
          </p>
          {asset.price_negotiable && (
            <span className="rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-semibold text-accent-foreground sm:px-2 sm:text-[10px]">
              Negotiable
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
