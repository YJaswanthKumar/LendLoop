import { useState } from "react";
import { toast } from "sonner";
import { getApiError } from "@/api/api";
import { cancelRental } from "@/services/rentalService";
import { CANCELLATION_POLICY_LABELS, estimateRefundPercent } from "@/utils/cancellationPolicy";
import { formatPrice } from "@/utils/format";
import type { Rental } from "@/utils/types";
import { Modal } from "./Modal";

export function CancelRentalModal({
  rental,
  isOwner,
  onClose,
  onDone,
}: {
  rental: Rental | null;
  isOwner: boolean;
  onClose: () => void;
  onDone: (updated: Rental) => void;
}) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const price = rental
    ? (rental.agreed_price ?? rental.counter_offer_price ?? rental.offered_price ?? rental.expected_price)
    : 0;
  const policy = rental?.cancellation_policy;
  // The owner backing out of a confirmed booking always refunds the
  // borrower in full — matches the backend's calculateCancellationRefund.
  const refundPercent = !rental
    ? 0
    : isOwner
      ? 100
      : policy
        ? estimateRefundPercent(policy, rental.start_date)
        : 100;
  const refundAmount = Math.round((price * refundPercent) / 100);
  const hasDeposit = (rental?.security_deposit ?? 0) > 0 && rental?.deposit_status === "HELD";

  const submit = async () => {
    if (!rental) return;
    setSubmitting(true);
    try {
      const updated = await cancelRental(rental.id, reason);
      toast.success("Booking cancelled");
      setReason("");
      onDone(updated);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={Boolean(rental)} onClose={onClose} title="Cancel this booking?">
      {rental && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {rental.asset?.title ?? "This item"}'s{" "}
            {policy ? `${CANCELLATION_POLICY_LABELS[policy]} cancellation policy` : "cancellation policy"} applies.
          </p>

          <div className="rounded-xl border border-border bg-muted/50 p-4 text-sm">
            <p className="flex items-center justify-between">
              <span className="text-muted-foreground">Recommended refund</span>
              <span className="font-bold text-foreground">
                {formatPrice(refundAmount)} ({refundPercent}%)
              </span>
            </p>
            {hasDeposit && (
              <p className="mt-1.5 flex items-center justify-between border-t border-border pt-1.5">
                <span className="text-muted-foreground">Security deposit</span>
                <span className="font-bold text-foreground">
                  {formatPrice(rental.security_deposit ?? 0)} — refunded automatically
                </span>
              </p>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            LendLoop doesn't process payments directly — this is guidance for how you and the other party
            should settle up.
          </p>

          <div>
            <label className="mb-1 block text-sm font-semibold">
              Reason <span className="font-normal text-muted-foreground">— optional, shown to the other party</span>
            </label>
            <textarea
              className="input-base min-h-20"
              placeholder="Let them know why you're cancelling…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
            />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} disabled={submitting} className="btn-outline flex-1 py-2.5 text-sm">
              Keep booking
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="btn-outline flex-1 py-2.5 text-sm text-destructive border-destructive/40 hover:bg-destructive/10"
            >
              {submitting ? "Cancelling…" : "Yes, cancel"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
