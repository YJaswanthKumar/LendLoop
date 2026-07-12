import { Link } from "@tanstack/react-router";
import { CalendarDays, IndianRupee, MessageSquare } from "lucide-react";
import type { Rental } from "@/utils/types";
import { formatDate, formatPrice } from "@/utils/format";
import { StatusBadge } from "./StatusBadge";

export type RentalAction =
  | "accept"
  | "reject"
  | "cancel"
  | "complete"
  | "counter"
  | "review";

export function RentalCard({
  rental,
  currentUserId,
  onAction,
  busy,
}: {
  rental: Rental;
  currentUserId: string;
  onAction: (action: RentalAction, rental: Rental) => void;
  busy: boolean;
}) {
  const isOwner = rental.owner_id === currentUserId;
  const role = isOwner ? "You own this item" : "You requested this item";
  const price =
    rental.agreed_price ?? rental.counter_offer_price ?? rental.offered_price ?? rental.expected_price;

  const actions: { label: string; action: RentalAction; primary?: boolean; danger?: boolean }[] = [];
  switch (rental.status) {
    case "REQUESTED":
      if (isOwner) {
        actions.push({ label: "Accept", action: "accept", primary: true });
        actions.push({ label: "Counter offer", action: "counter" });
        actions.push({ label: "Reject", action: "reject", danger: true });
      } else {
        actions.push({ label: "Cancel request", action: "cancel", danger: true });
      }
      break;
    case "NEGOTIATING":
      actions.push({ label: "Accept offer", action: "accept", primary: true });
      if (isOwner) actions.push({ label: "Reject", action: "reject", danger: true });
      else actions.push({ label: "Cancel", action: "cancel", danger: true });
      break;
    case "ACCEPTED":
      actions.push({ label: "Mark completed", action: "complete", primary: true });
      actions.push({ label: "Cancel", action: "cancel", danger: true });
      break;
    case "ACTIVE":
      actions.push({ label: "Mark completed", action: "complete", primary: true });
      break;
    case "COMPLETED":
      actions.push({ label: "Leave a review", action: "review", primary: true });
      break;
    default:
      break;
  }

  return (
    <div className="card-elevated flex flex-col gap-4 p-4 sm:flex-row">
      <Link
        to="/assets/$assetId"
        params={{ assetId: rental.asset_id }}
        className="h-24 w-full shrink-0 overflow-hidden rounded-lg bg-muted sm:w-32"
      >
        {rental.asset?.image_url ? (
          <img
            src={rental.asset.image_url}
            alt={rental.asset.title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl font-black text-muted-foreground/30">
            {rental.asset?.category?.[0] ?? "?"}
          </div>
        )}
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/assets/$assetId"
            params={{ assetId: rental.asset_id }}
            className="font-semibold hover:underline"
          >
            {rental.asset?.title ?? "Item unavailable"}
          </Link>
          <StatusBadge status={rental.status} />
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{role}</p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" />
            {formatDate(rental.start_date)} → {formatDate(rental.end_date)} · {rental.total_days}d
          </span>
          <span className="flex items-center gap-1 font-semibold text-foreground">
            <IndianRupee className="h-3.5 w-3.5" />
            {formatPrice(price).replace("₹", "")}
            {rental.status === "NEGOTIATING" && rental.counter_offer_price != null && (
              <span className="text-xs font-normal text-muted-foreground">(counter offer)</span>
            )}
          </span>
        </div>
        {(rental.borrower_message || rental.owner_message) && (
          <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            <MessageSquare className="mt-0.5 h-3 w-3 shrink-0" />
            <span className="line-clamp-2">{rental.owner_message ?? rental.borrower_message}</span>
          </p>
        )}
        {actions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {actions.map((a) => (
              <button
                key={a.action}
                disabled={busy}
                onClick={() => onAction(a.action, rental)}
                className={
                  a.primary
                    ? "btn-primary px-4 py-1.5 text-xs"
                    : a.danger
                      ? "btn-outline px-4 py-1.5 text-xs text-destructive"
                      : "btn-outline px-4 py-1.5 text-xs"
                }
              >
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
