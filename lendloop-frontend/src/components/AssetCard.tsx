import { Link } from "@tanstack/react-router";
import { MapPin, Star } from "lucide-react";
import type { Asset } from "@/utils/types";
import { formatPrice } from "@/utils/format";
import { StatusBadge } from "./StatusBadge";

export function AssetCard({ asset }: { asset: Asset }) {
  return (
    <Link
      to="/assets/$assetId"
      params={{ assetId: asset.id }}
      className="card-elevated group block overflow-hidden transition-shadow hover:shadow-(--shadow-card-hover)"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
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
        <div className="absolute left-3 top-3">
          <StatusBadge status={asset.availability_status} />
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-semibold">{asset.title}</h3>
          {asset.average_rating > 0 && (
            <span className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
              <Star className="h-3.5 w-3.5 fill-current text-primary" />
              {Number(asset.average_rating).toFixed(1)}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {asset.category}
        </p>
        {(asset.city || asset.distance_km != null) && (
          <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {asset.distance_km != null
              ? `${Number(asset.distance_km).toFixed(1)} km away`
              : asset.city}
          </p>
        )}
        <div className="mt-3 flex items-baseline justify-between">
          <p className="text-base font-bold">
            {formatPrice(asset.expected_price_per_day)}
            <span className="text-xs font-normal text-muted-foreground"> / day</span>
          </p>
          {asset.price_negotiable && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
              Negotiable
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
