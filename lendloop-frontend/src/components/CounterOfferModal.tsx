import { useState } from "react";
import { toast } from "sonner";
import { getApiError } from "@/api/api";
import { counterOffer } from "@/services/rentalService";
import type { Rental } from "@/utils/types";
import { formatPrice } from "@/utils/format";
import { Modal } from "./Modal";

export function CounterOfferModal({
  rental,
  onClose,
  onDone,
}: {
  rental: Rental | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rental) return;
    if (!price || Number(price) <= 0) {
      setError("Enter a valid counter offer price");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await counterOffer(rental.id, Number(price), message.trim() || undefined);
      toast.success("Counter offer sent");
      onDone();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={Boolean(rental)} onClose={onClose} title="Send counter offer">
      {rental && (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
            Borrower offered <strong className="text-foreground">{formatPrice(rental.offered_price)}</strong>{" "}
            (expected {formatPrice(rental.expected_price)}).
          </p>
          <div>
            <label className="mb-1 block text-sm font-semibold">Your counter price (₹ total)</label>
            <input
              type="number"
              min="1"
              className="input-base"
              placeholder="3400"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">
              Message <span className="font-normal text-muted-foreground">— optional</span>
            </label>
            <textarea
              className="input-base min-h-20"
              placeholder="Best I can do is…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full py-3 text-sm">
            {submitting ? "Sending…" : "Send counter offer"}
          </button>
        </form>
      )}
    </Modal>
  );
}
