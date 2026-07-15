import { useState } from "react";
import { toast } from "sonner";
import { getApiError } from "@/api/api";
import { resolveDeposit } from "@/services/rentalService";
import { formatPrice } from "@/utils/format";
import type { DepositStatus, Rental } from "@/utils/types";
import { Modal } from "./Modal";

type ResolutionChoice = Extract<DepositStatus, "REFUNDED" | "PARTIALLY_REFUNDED" | "FORFEITED">;

const OPTIONS: { value: ResolutionChoice; label: string; hint: string }[] = [
  { value: "REFUNDED", label: "Refund in full", hint: "Item returned in good condition" },
  { value: "PARTIALLY_REFUNDED", label: "Partially refund", hint: "Minor damage or missing accessories" },
  { value: "FORFEITED", label: "Forfeit deposit", hint: "Significant damage or loss" },
];

export function DepositResolutionModal({
  rental,
  onClose,
  onDone,
}: {
  rental: Rental | null;
  onClose: () => void;
  onDone: (updated: Rental) => void;
}) {
  const [choice, setChoice] = useState<ResolutionChoice>("REFUNDED");
  const [partialAmount, setPartialAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const deposit = rental?.security_deposit ?? 0;

  const submit = async () => {
    if (!rental) return;
    if (choice === "PARTIALLY_REFUNDED") {
      const amt = Number(partialAmount);
      if (!partialAmount || Number.isNaN(amt) || amt < 0 || amt > deposit) {
        setError(`Enter an amount between ₹0 and ${formatPrice(deposit)}`);
        return;
      }
    }
    setError("");
    setSubmitting(true);
    try {
      const updated = await resolveDeposit(
        rental.id,
        choice,
        choice === "PARTIALLY_REFUNDED" ? Number(partialAmount) : undefined,
        notes,
      );
      toast.success("Deposit resolved");
      setNotes("");
      setPartialAmount("");
      onDone(updated);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={Boolean(rental)} onClose={onClose} title="Resolve security deposit">
      {rental && (
        <div className="space-y-4">
          <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
            {rental.asset?.title ?? "This item"}'s deposit of{" "}
            <strong className="text-foreground">{formatPrice(deposit)}</strong> is being held. Choose how it
            should be settled with the borrower.
          </p>

          <div className="space-y-2">
            {OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setChoice(opt.value)}
                className={`w-full rounded-xl border px-3.5 py-3 text-left transition-colors ${
                  choice === opt.value ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
                }`}
              >
                <span className="block text-sm font-semibold">{opt.label}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{opt.hint}</span>
              </button>
            ))}
          </div>

          {choice === "PARTIALLY_REFUNDED" && (
            <div>
              <label className="mb-1 block text-sm font-semibold">Refund amount (₹)</label>
              <input
                type="number"
                min="0"
                max={deposit}
                className="input-base"
                placeholder={String(Math.round(deposit / 2))}
                value={partialAmount}
                onChange={(e) => setPartialAmount(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-semibold">
              Notes <span className="font-normal text-muted-foreground">— optional, shown to the borrower</span>
            </label>
            <textarea
              className="input-base min-h-16"
              placeholder="Explain your decision…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <button type="button" disabled={submitting} onClick={submit} className="btn-primary w-full py-3 text-sm">
            {submitting ? "Saving…" : "Confirm resolution"}
          </button>
        </div>
      )}
    </Modal>
  );
}
