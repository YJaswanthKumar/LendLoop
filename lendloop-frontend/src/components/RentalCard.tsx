import { Link } from "@tanstack/react-router";
import { CalendarDays, IndianRupee, Mail, MapPin, MessageSquare, Phone } from "lucide-react";
import type { Rental } from "@/utils/types";
import { formatDate, formatPrice } from "@/utils/format";
import { StatusBadge } from "./StatusBadge";
import { CancellationPolicyBadge } from "./CancellationPolicyBadge";
import { DepositSummary } from "./DepositBadge";

export type RentalAction =
  | "accept"
  | "reject"
  | "cancel"
  | "start"
  | "complete"
  | "counter"
  | "review"
  | "resolveDeposit";

function roleDescription(status: Rental["status"], isOwner: boolean): string {
  switch (status) {
    case "REQUESTED":
      return isOwner ? "New request — respond to reserve it" : "Sent — waiting on owner's response";
    case "NEGOTIATING":
      return isOwner ? "Counter offer sent — waiting on borrower" : "Owner proposed a new price";
    case "ACCEPTED":
      return isOwner ? "Booking confirmed — confirm pickup to start" : "Booking confirmed — awaiting pickup";
    case "ACTIVE":
      return isOwner ? "Rental in progress — confirm return when it's back" : "Rental in progress";
    case "COMPLETED":
      return "Rental completed";
    case "REJECTED":
      return "Request declined";
    case "CANCELLED":
      return "Request withdrawn";
    default:
      return isOwner ? "You own this item" : "You requested this item";
  }
}

function googleMapsUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

function ContactDetails({ rental, isOwner }: { rental: Rental; isOwner: boolean }) {
  const contact = isOwner ? rental.borrower_contact : rental.owner_contact;
  if (!contact) return null;

  // Use the asset's pickup coordinates — these are the item's location, which
  // is always set when the owner lists the item. Owner profile coords (on
  // OwnerContact) are often null, so we don't rely on them.
  const pickup =
    !isOwner && rental.asset?.latitude != null && rental.asset?.longitude != null
      ? { latitude: rental.asset.latitude!, longitude: rental.asset.longitude! }
      : null;

  return (
    <div className="mt-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs">
      <p className="font-semibold text-foreground">
        {isOwner ? "Borrower" : "Owner"} contact
      </p>
      <div className="mt-1 flex flex-col gap-1 text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="font-medium text-foreground">{contact.full_name}</span>
        </span>
        {contact.phone && (
          <span className="flex items-center gap-1.5">
            <Phone className="h-3 w-3 shrink-0" />
            {contact.phone}
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <Mail className="h-3 w-3 shrink-0" />
          {contact.email}
        </span>
        {(contact.city || contact.state) && (
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3 w-3 shrink-0" />
            {[contact.city, contact.state].filter(Boolean).join(", ")}
          </span>
        )}
      </div>
      {pickup && (
        <a
          href={googleMapsUrl(pickup.latitude, pickup.longitude)}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          <MapPin className="h-3 w-3" />
          Open pickup location in Google Maps
        </a>
      )}
    </div>
  );
}

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
  const price =
    rental.agreed_price ?? rental.counter_offer_price ?? rental.offered_price ?? rental.expected_price;

  const actions: { label: string; action: RentalAction; primary?: boolean; danger?: boolean }[] = [];
  switch (rental.status) {
    case "REQUESTED":
      if (isOwner) {
        actions.push({ label: "Approve", action: "accept", primary: true });
        actions.push({ label: "Negotiate price", action: "counter" });
        actions.push({ label: "Decline", action: "reject", danger: true });
      } else {
        actions.push({ label: "Withdraw request", action: "cancel", danger: true });
      }
      break;
    case "NEGOTIATING":
      if (!isOwner) {
        actions.push({ label: "Accept counter offer", action: "accept", primary: true });
        actions.push({ label: "Withdraw request", action: "cancel", danger: true });
      } else {
        actions.push({ label: "Withdraw offer", action: "reject", danger: true });
      }
      break;
    case "ACCEPTED":
      if (isOwner) {
        actions.push({ label: "Borrower picked up", action: "start", primary: true });
      }
      actions.push({ label: "Cancel booking", action: "cancel", danger: true });
      break;
    case "ACTIVE":
      if (isOwner) {
        actions.push({ label: "Borrower returned", action: "complete", primary: true });
      }
      break;
    case "COMPLETED":
      actions.push({ label: "Rate this rental", action: "review", primary: true });
      if (isOwner && rental.deposit_status === "HELD") {
        actions.push({ label: "Resolve security deposit", action: "resolveDeposit" });
      }
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
          {rental.cancellation_policy && !["COMPLETED", "REJECTED", "CANCELLED"].includes(rental.status) && (
            <CancellationPolicyBadge policy={rental.cancellation_policy} />
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{roleDescription(rental.status, isOwner)}</p>
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
        <ContactDetails rental={rental} isOwner={isOwner} />
        <DepositSummary
          amount={rental.security_deposit ?? 0}
          status={rental.deposit_status}
          refundAmount={rental.deposit_refund_amount}
          notes={rental.deposit_notes}
        />
        {rental.status === "CANCELLED" && rental.refund_amount != null && (
          <p className="mt-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            Cancelled{rental.cancellation_reason ? `: "${rental.cancellation_reason}"` : ""} — recommended
            refund <strong className="text-foreground">{formatPrice(rental.refund_amount)}</strong>
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
