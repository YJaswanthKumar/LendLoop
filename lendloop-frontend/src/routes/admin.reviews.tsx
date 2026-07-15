import { createFileRoute } from "@tanstack/react-router";
import { Star, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { getApiError } from "@/api/api";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Loader } from "@/components/Loader";
import { Pagination } from "@/components/Pagination";
import { deleteAdminReview, listAdminReviews } from "@/services/adminService";
import { timeAgo } from "@/utils/format";
import type { AdminReview, PaginationInfo } from "@/utils/types";

export const Route = createFileRoute("/admin/reviews")({
  head: () => ({ meta: [{ title: "Reviews — Admin — LendLoop" }] }),
  component: AdminReviewsPage,
});

function AdminReviewsPage() {
  const [minRating, setMinRating] = useState("");
  const [page, setPage] = useState(1);

  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listAdminReviews({
        page,
        limit: 20,
        minRating: minRating ? Number(minRating) : undefined,
      });
      setReviews(data.reviews);
      setPagination(data.pagination);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [page, minRating]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (review: AdminReview) => {
    if (!confirm("Delete this review? This can't be undone.")) return;
    setBusyId(review.id);
    try {
      await deleteAdminReview(review.id);
      setReviews((prev) => prev.filter((r) => r.id !== review.id));
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setBusyId(null);
    }
  };

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length).toFixed(2)
    : "—";

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Reviews</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {pagination?.totalItems ?? 0} total reviews · this page averages {avgRating}★
      </p>

      <div className="mt-4">
        <select
          className="input-base sm:w-56"
          value={minRating}
          onChange={(e) => {
            setMinRating(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All ratings</option>
          <option value="4">4★ and up</option>
          <option value="3">3★ and up</option>
          <option value="2">2★ and up</option>
          <option value="1">1★ and up</option>
        </select>
      </div>

      <div className="mt-6">
        {loading ? (
          <Loader label="Loading reviews…" />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : reviews.length === 0 ? (
          <EmptyState title="No reviews found" description="Try a different filter." />
        ) : (
          <>
            <div className="card-elevated divide-y divide-border overflow-hidden">
              {reviews.map((r) => (
                <div key={r.id} className="flex items-start justify-between gap-4 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-sm font-semibold">
                      <Star className="h-3.5 w-3.5 fill-current text-primary" /> {r.rating}
                      <span className="font-normal text-muted-foreground">
                        · {r.reviewer?.full_name ?? "Unknown"} → {r.receiver?.full_name ?? "Unknown"}
                      </span>
                    </div>
                    {r.review && <p className="mt-1 text-sm text-muted-foreground">{r.review}</p>}
                    <p className="mt-1 text-[11px] text-muted-foreground">{timeAgo(r.created_at)}</p>
                  </div>
                  <button
                    onClick={() => remove(r)}
                    disabled={busyId === r.id}
                    className="btn-outline h-8 w-8 shrink-0 p-0 text-destructive"
                    title="Delete review"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            {pagination && <Pagination pagination={{ ...pagination, page }} onPageChange={setPage} />}
          </>
        )}
      </div>
    </div>
  );
}
