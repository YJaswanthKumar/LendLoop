import { createFileRoute } from "@tanstack/react-router";
import { Inbox, Send } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { getApiError } from "@/api/api";
import { CounterOfferModal } from "@/components/CounterOfferModal";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Loader } from "@/components/Loader";
import { RentalCard, type RentalAction } from "@/components/RentalCard";
import { ReviewModal } from "@/components/ReviewModal";
import { useAuth } from "@/context/AuthContext";
import {
  acceptRental,
  cancelRental,
  completeRental,
  rejectRental,
  rentalHistory,
} from "@/services/rentalService";
import { enrichRentalsWithAssets } from "@/utils/enrichRentals";
import type { Rental } from "@/utils/types";

export const Route = createFileRoute("/_authenticated/requests")({
  head: () => ({
    meta: [
      { title: "Rental requests — LendLoop" },
      { name: "description", content: "Manage incoming and outgoing rental requests: accept, reject or counter offer." },
    ],
  }),
  component: RequestsPage,
});

const PENDING = new Set(["REQUESTED", "NEGOTIATING", "ACCEPTED", "ACTIVE"]);

function RequestsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"incoming" | "outgoing">("incoming");
  const [incoming, setIncoming] = useState<Rental[]>([]);
  const [outgoing, setOutgoing] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [counterTarget, setCounterTarget] = useState<Rental | null>(null);
  const [reviewTarget, setReviewTarget] = useState<Rental | null>(null);

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

  useEffect(() => {
    load();
  }, [load]);

  const onAction = async (action: RentalAction, rental: Rental) => {
    if (action === "counter") {
      setCounterTarget(rental);
      return;
    }
    if (action === "review") {
      setReviewTarget(rental);
      return;
    }
    setBusyId(rental.id);
    try {
      if (action === "accept") {
        await acceptRental(rental.id);
        toast.success("Offer accepted 🎉");
      } else if (action === "reject") {
        await rejectRental(rental.id);
        toast.success("Request rejected");
      } else if (action === "cancel") {
        await cancelRental(rental.id);
        toast.success("Request cancelled");
      } else if (action === "complete") {
        await completeRental(rental.id);
        toast.success("Rental completed");
      }
      await load();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setBusyId(null);
    }
  };

  const list = tab === "incoming" ? incoming : outgoing;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-extrabold tracking-tight">Rental requests</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Accept, reject or negotiate offers on your items.
      </p>

      <div className="mt-5 flex gap-2">
        <button
          onClick={() => setTab("incoming")}
          className={tab === "incoming" ? "btn-primary px-5 py-2 text-sm" : "btn-outline px-5 py-2 text-sm"}
        >
          <Inbox className="h-4 w-4" /> Incoming ({incoming.length})
        </button>
        <button
          onClick={() => setTab("outgoing")}
          className={tab === "outgoing" ? "btn-primary px-5 py-2 text-sm" : "btn-outline px-5 py-2 text-sm"}
        >
          <Send className="h-4 w-4" /> Outgoing ({outgoing.length})
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {loading ? (
          <Loader label="Loading requests…" />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : list.length === 0 ? (
          <EmptyState
            title={tab === "incoming" ? "No incoming requests" : "No outgoing requests"}
            description={
              tab === "incoming"
                ? "When someone requests your items, they'll show up here."
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
          load();
        }}
      />
      <ReviewModal
        rental={reviewTarget}
        currentUserId={user!.id}
        onClose={() => setReviewTarget(null)}
        onDone={() => {
          setReviewTarget(null);
          load();
        }}
      />
    </div>
  );
}
