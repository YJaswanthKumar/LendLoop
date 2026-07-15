import { Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { getApiError } from "@/api/api";
import { createReview } from "@/services/reviewService";
import type { Rental } from "@/utils/types";
import { Modal } from "./Modal";

export function ReviewModal({
  rental,
  currentUserId,
  onClose,
  onDone,
}: {
  rental: Rental | null;
  currentUserId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rental) return;
    const receiverId =
      rental.owner_id === currentUserId ? rental.borrower_id : rental.owner_id;
    setSubmitting(true);
    try {
      await createReview({
        rentalId: rental.id,
        receiverId,
        rating,
        review: text.trim() || undefined,
      });
      toast.success("Review submitted — thank you!");
      onDone();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={Boolean(rental)} onClose={onClose} title="Leave a review">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label className="mb-2 block text-sm font-semibold">Rating</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setRating(i)}
                aria-label={`${i} star${i > 1 ? "s" : ""}`}
              >
                <Star
                  className={`h-8 w-8 transition-colors ${i <= rating ? "fill-current text-primary" : "text-muted-foreground/30"}`}
                />
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold">
            Review <span className="font-normal text-muted-foreground">— optional</span>
          </label>
          <textarea
            className="input-base min-h-24"
            placeholder="How was the experience?"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
        <button type="submit" disabled={submitting} className="btn-primary w-full py-3 text-sm">
          {submitting ? "Submitting…" : "Submit review"}
        </button>
      </form>
    </Modal>
  );
}
