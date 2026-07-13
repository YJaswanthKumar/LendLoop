import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { getApiError } from "@/api/api";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Loader } from "@/components/Loader";
import { RentalCard, type RentalAction } from "@/components/RentalCard";
import { ReviewModal } from "@/components/ReviewModal";
import { useAuth } from "@/context/AuthContext";
import { cancelRental, completeRental, rentalHistory, startRental } from "@/services/rentalService";
import { enrichRentalsWithAssets } from "@/utils/enrichRentals";
import type { Rental } from "@/utils/types";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [
      { title: "Rental history — LendLoop" },
      { name: "description", content: "Your active, completed and cancelled rentals on LendLoop." },
    ],
  }),
  component: HistoryPage,
});

type Tab = "active" | "completed" | "cancelled";

const TABS: { key: Tab; label: string; statuses: string[] }[] = [
  { key: "active", label: "Active", statuses: ["ACCEPTED", "ACTIVE"] },
  { key: "completed", label: "Completed", statuses: ["COMPLETED"] },
  { key: "cancelled", label: "Cancelled", statuses: ["CANCELLED", "REJECTED"] },
];

function HistoryPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("active");
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reviewTarget, setReviewTarget] = useState<Rental | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await rentalHistory({ limit: 100 });
      setRentals(await enrichRentalsWithAssets(data.rentals));
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
    if (action === "review") {
      setReviewTarget(rental);
      return;
    }
    setBusyId(rental.id);
    try {
      if (action === "start") {
        await startRental(rental.id);
        toast.success("Pickup confirmed — rental started");
      } else if (action === "complete") {
        await completeRental(rental.id);
        toast.success("Return confirmed — rental completed");
      } else if (action === "cancel") {
        await cancelRental(rental.id);
        toast.success("Booking cancelled");
      }
      await load();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setBusyId(null);
    }
  };

  const current = TABS.find((t) => t.key === tab)!;
  const list = rentals.filter((r) => current.statuses.includes(r.status));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-extrabold tracking-tight">Rental history</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Everything you've rented out and borrowed.
      </p>

      <div className="mt-5 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={tab === t.key ? "btn-primary px-5 py-2 text-sm" : "btn-outline px-5 py-2 text-sm"}
          >
            {t.label} ({rentals.filter((r) => t.statuses.includes(r.status)).length})
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {loading ? (
          <Loader label="Loading rentals…" />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : list.length === 0 ? (
          <EmptyState
            title={`No ${current.label.toLowerCase()} rentals`}
            description="Rentals will appear here as their status changes."
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
