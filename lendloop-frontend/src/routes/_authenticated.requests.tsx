import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CalendarDays, Inbox, IndianRupee, Send } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { getApiError } from "@/api/api";
import { CancelRentalModal } from "@/components/CancelRentalModal";
import { CounterOfferModal } from "@/components/CounterOfferModal";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Loader } from "@/components/Loader";
import { Modal } from "@/components/Modal";
import { RentalCard, type RentalAction } from "@/components/RentalCard";
import { ReviewModal } from "@/components/ReviewModal";
import { useAuth } from "@/context/AuthContext";
import {
  acceptRental,
  completeRental,
  rejectRental,
  rentalHistory,
  startRental,
} from "@/services/rentalService";
import { enrichRentalsWithAssets } from "@/utils/enrichRentals";
import { formatDate, formatPrice } from "@/utils/format";
import type { Rental } from "@/utils/types";

export const Route = createFileRoute("/_authenticated/requests")({
  head: () => ({
    meta: [
      { title: "Rental requests — LendLoop" },
      { name: "description", content: "Manage incoming and outgoing rental requests: accept, reject or counter offer." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    tab: (search.tab === "outgoing" ? "outgoing" : "incoming") as "incoming" | "outgoing",
  }),
  component: RequestsPage,
});

const PENDING = new Set(["REQUESTED", "NEGOTIATING", "ACCEPTED", "ACTIVE"]);

type ConfirmTarget = { rental: Rental; action: "start" | "complete" };

function RequestsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { tab } = Route.useSearch();
  const [incoming, setIncoming] = useState<Rental[]>([]);
  const [outgoing, setOutgoing] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [counterTarget, setCounterTarget] = useState<Rental | null>(null);
  const [reviewTarget, setReviewTarget] = useState<Rental | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Rental | null>(null);

  // Initial load — shows full-page spinner. Also used for manual retry.
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [own, borr] = await Promise.all([
        rentalHistory({ role: "owner", limit: 50 }),
        rentalHistory({ role: "borrower", limit: 50 }),
      ]);
      setIncoming(await enrichRentalsWithAssets(own.rentals.filter((r) => PENDING.has(r.status))));
      setOutgoing(await enrichRentalsWithAssets(borr.rentals.filter((r) => PENDING.has(r.status))));
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // Silent background refresh after an action — does NOT set loading=true so
  // existing cards remain visible.
  const silentRefresh = useCallback(async () => {
    try {
      const [own, borr] = await Promise.all([
        rentalHistory({ role: "owner", limit: 50 }),
        rentalHistory({ role: "borrower", limit: 50 }),
      ]);
      setIncoming(await enrichRentalsWithAssets(own.rentals.filter((r) => PENDING.has(r.status))));
      setOutgoing(await enrichRentalsWithAssets(borr.rentals.filter((r) => PENDING.has(r.status))));
    } catch {
      // Tolerate failures — the optimistic update keeps the UI consistent.
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const changeTab = (t: "incoming" | "outgoing") => {
    navigate({ to: "/requests", search: { tab: t }, replace: true });
  };

  const onAction = async (action: RentalAction, rental: Rental) => {
    if (action === "counter") {
      setCounterTarget(rental);
      return;
    }
    if (action === "review") {
      setReviewTarget(rental);
      return;
    }
    // Pickup / return — show confirmation dialog first
    if (action === "start" || action === "complete") {
      setConfirmTarget({ rental, action });
      return;
    }
    if (action === "cancel") {
      setCancelTarget(rental);
      return;
    }
    setBusyId(rental.id);
    try {
      let updated: Rental | null = null;
      if (action === "accept") {
        updated = await acceptRental(rental.id);
        toast.success("Booking confirmed 🎉");
      } else if (action === "reject") {
        updated = await rejectRental(rental.id);
        toast.success("Request declined");
      }

      if (updated) {
        const patch = (list: Rental[]) =>
          list.map((r) => r.id === rental.id ? { ...updated!, asset: r.asset } : r);
        setIncoming(patch);
        setOutgoing(patch);
      }
      silentRefresh();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirm = async () => {
    if (!confirmTarget) return;
    const { rental, action } = confirmTarget;
    setConfirmBusy(true);
    try {
      let updated: Rental | null = null;
      if (action === "start") {
        updated = await startRental(rental.id);
        toast.success("Pickup confirmed — rental is now active");
      } else {
        updated = await completeRental(rental.id);
        toast.success("Return confirmed — rental completed");
      }
      setConfirmTarget(null);
      if (updated) {
        const patch = (list: Rental[]) =>
          list.map((r) => r.id === rental.id ? { ...updated!, asset: r.asset } : r);
        setIncoming(patch);
        setOutgoing(patch);
      }
      silentRefresh();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setConfirmBusy(false);
    }
  };

  const list = tab === "incoming" ? incoming : outgoing;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-extrabold tracking-tight">Requests</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Review requests on your items and track the ones you've sent.
      </p>

      <div className="mt-5 flex gap-2">
        <button
          onClick={() => changeTab("incoming")}
          className={tab === "incoming" ? "btn-primary px-5 py-2 text-sm" : "btn-outline px-5 py-2 text-sm"}
        >
          <Inbox className="h-4 w-4" /> Received ({incoming.length})
        </button>
        <button
          onClick={() => changeTab("outgoing")}
          className={tab === "outgoing" ? "btn-primary px-5 py-2 text-sm" : "btn-outline px-5 py-2 text-sm"}
        >
          <Send className="h-4 w-4" /> Sent ({outgoing.length})
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {loading ? (
          <Loader label="Loading requests…" />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : list.length === 0 ? (
          <EmptyState
            title={tab === "incoming" ? "No requests received yet" : "No requests sent yet"}
            description={
              tab === "incoming"
                ? "When someone requests one of your items, it'll show up here."
                : "Browse items and send your first rental request."
            }
          />
        ) : (
          list.map((r) => (
            <RentalCard
              key={r.id}
              rental={r}
              currentUserId={user!.id}
              onAction={onAction}
              busy={busyId === r.id}
            />
          ))
        )}
      </div>

      <CounterOfferModal
        rental={counterTarget}
        onClose={() => setCounterTarget(null)}
        onDone={() => {
          setCounterTarget(null);
          silentRefresh();
        }}
      />
      <ReviewModal
        rental={reviewTarget}
        currentUserId={user!.id}
        onClose={() => setReviewTarget(null)}
        onDone={() => {
          setReviewTarget(null);
          silentRefresh();
        }}
      />
      <ConfirmActionModal
        target={confirmTarget}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmTarget(null)}
        busy={confirmBusy}
      />
      <CancelRentalModal
        rental={cancelTarget}
        isOwner={cancelTarget?.owner_id === user?.id}
        onClose={() => setCancelTarget(null)}
        onDone={(updated) => {
          setCancelTarget(null);
          const patch = (list: Rental[]) =>
            list.map((r) => (r.id === updated.id ? { ...updated, asset: r.asset } : r));
          setIncoming(patch);
          setOutgoing(patch);
          silentRefresh();
        }}
      />
    </div>
  );
}

function ConfirmActionModal({
  target,
  onConfirm,
  onCancel,
  busy,
}: {
  target: ConfirmTarget | null;
  onConfirm: () => void;
  onCancel: () => void;
  busy: boolean;
}) {
  if (!target) return null;
  const { rental, action } = target;
  const isPickup = action === "start";
  const borrowerName = rental.borrower_contact?.full_name ?? "the borrower";
  const price =
    rental.agreed_price ?? rental.counter_offer_price ?? rental.offered_price ?? rental.expected_price;

  return (
    <Modal
      open={true}
      onClose={onCancel}
      title={isPickup ? "Confirm pickup" : "Confirm return"}
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {isPickup
            ? `Confirm that ${borrowerName} has physically collected the item. This will start the rental.`
            : `Confirm that ${borrowerName} has returned the item in the agreed condition. This will complete the rental.`}
        </p>

        <div className="rounded-xl border border-border bg-muted/50 p-4 space-y-2.5 text-sm">
          <p className="font-semibold text-base">{rental.asset?.title ?? "Item"}</p>
          {rental.borrower_contact && (
            <p className="flex items-center gap-2 text-muted-foreground">
              Borrower:
              <span className="font-medium text-foreground">{rental.borrower_contact.full_name}</span>
              {rental.borrower_contact.phone && (
                <span className="text-muted-foreground">· {rental.borrower_contact.phone}</span>
              )}
            </p>
          )}
          <p className="flex items-center gap-1.5 text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            {formatDate(rental.start_date)} → {formatDate(rental.end_date)}
            <span className="font-medium text-foreground">· {rental.total_days}d</span>
          </p>
          <p className="flex items-center gap-1.5 text-muted-foreground">
            <IndianRupee className="h-3.5 w-3.5 shrink-0" />
            Agreed price:
            <span className="font-semibold text-foreground">{formatPrice(price)}</span>
          </p>
        </div>

        {!isPickup && (
          <p className="rounded-lg bg-accent px-3 py-2 text-xs text-accent-foreground">
            ⚠️ This is final — once confirmed, the rental is marked completed and cannot be undone.
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="btn-outline flex-1 py-2.5 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="btn-primary flex-1 py-2.5 text-sm"
          >
            {busy
              ? isPickup ? "Confirming…" : "Completing…"
              : isPickup ? "Yes, confirm pickup" : "Yes, confirm return"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
