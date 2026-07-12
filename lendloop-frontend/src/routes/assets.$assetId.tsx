import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  CalendarDays,
  ChevronLeft,
  MapPin,
  ShieldCheck,
  Star,
  Tag,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { getApiError } from "@/api/api";
import { ErrorState } from "@/components/ErrorState";
import { Loader } from "@/components/Loader";
import { Modal } from "@/components/Modal";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/context/AuthContext";
import { getAsset } from "@/services/assetService";
import { createRental } from "@/services/rentalService";
import { daysBetween, formatDate, formatPrice } from "@/utils/format";
import type { Asset } from "@/utils/types";

export const Route = createFileRoute("/assets/$assetId")({
  head: () => ({
    meta: [
      { title: "Item details — LendLoop" },
      { name: "description", content: "View item details, price and availability, and request a rental on LendLoop." },
    ],
  }),
  component: AssetDetailsPage,
});

function AssetDetailsPage() {
  const { assetId } = Route.useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getAsset(assetId)
      .then(setAsset)
      .catch((err) => setError(getApiError(err)))
      .finally(() => setLoading(false));
  }, [assetId]);

  useEffect(load, [load]);

  if (loading) return <Loader full label="Loading item…" />;
  if (error || !asset)
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <ErrorState message={error ?? "Item not found"} onRetry={load} />
      </div>
    );

  const isOwner = user?.id === asset.owner_id;

  const onRequest = () => {
    if (!isAuthenticated) {
      toast.info("Log in to request a rental");
      navigate({ to: "/login" });
      return;
    }
    setModalOpen(true);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link to="/browse" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Back to browse
      </Link>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Image */}
        <div className="lg:col-span-3">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted shadow-(--shadow-card)">
            {asset.image_url ? (
              <img src={asset.image_url} alt={asset.title} className="h-full w-full object-cover" width={800} height={600} />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-7xl font-black text-muted-foreground/20">
                {asset.category?.[0] ?? "?"}
              </div>
            )}
            <div className="absolute left-4 top-4">
              <StatusBadge status={asset.availability_status} />
            </div>
          </div>

          <div className="card-elevated mt-6 p-5">
            <h2 className="font-bold">Description</h2>
            <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
              {asset.description || "No description provided."}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              {asset.brand && <Detail label="Brand" value={asset.brand} />}
              {asset.condition && <Detail label="Condition" value={asset.condition} />}
              {asset.purchase_year && <Detail label="Purchase year" value={String(asset.purchase_year)} />}
              <Detail label="Times rented" value={String(asset.usage_count)} />
              {asset.average_rating > 0 && (
                <Detail label="Rating" value={`${Number(asset.average_rating).toFixed(1)} ★`} />
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-2">
          <div className="card-elevated p-5">
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-xl font-extrabold leading-snug">{asset.title}</h1>
              {asset.average_rating > 0 && (
                <span className="flex shrink-0 items-center gap-1 text-sm font-semibold">
                  <Star className="h-4 w-4 fill-current text-primary" />
                  {Number(asset.average_rating).toFixed(1)}
                </span>
              )}
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Tag className="h-3 w-3" /> {asset.category}
            </p>

            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold">{formatPrice(asset.expected_price_per_day)}</span>
              <span className="text-sm text-muted-foreground">/ day</span>
              {asset.price_negotiable && (
                <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-accent-foreground">
                  Negotiable
                </span>
              )}
            </div>

            <div className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              {(asset.address || asset.city) && (
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0" />
                  {[asset.address, asset.city, asset.state].filter(Boolean).join(", ")}
                </p>
              )}
              {(asset.available_from || asset.available_to) && (
                <p className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 shrink-0" />
                  Available {formatDate(asset.available_from)} → {formatDate(asset.available_to)}
                </p>
              )}
              {asset.security_deposit != null && asset.security_deposit > 0 && (
                <p className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  Security deposit: <strong className="text-foreground">{formatPrice(asset.security_deposit)}</strong>
                </p>
              )}
            </div>

            <div className="mt-6">
              {isOwner ? (
                <Link
                  to="/edit-asset/$assetId"
                  params={{ assetId: asset.id }}
                  className="btn-outline w-full py-3 text-sm"
                >
                  Edit your listing
                </Link>
              ) : (
                <button
                  onClick={onRequest}
                  disabled={asset.availability_status !== "AVAILABLE"}
                  className="btn-primary w-full py-3 text-sm"
                >
                  {asset.availability_status === "AVAILABLE" ? "Request rental" : "Currently unavailable"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <RequestRentalModal
        asset={asset}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          setModalOpen(false);
          toast.success("Rental request sent!");
          navigate({ to: "/requests" });
        }}
      />
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function RequestRentalModal({
  asset,
  open,
  onClose,
  onSuccess,
}: {
  asset: Asset;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [offeredPrice, setOfferedPrice] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const days = startDate && endDate ? daysBetween(startDate, endDate) : 0;
  const expected = days * asset.expected_price_per_day;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const today = new Date().toISOString().slice(0, 10);
    if (!startDate) errs.startDate = "Pick a start date";
    else if (startDate < today) errs.startDate = "Start date cannot be in the past";
    if (!endDate) errs.endDate = "Pick an end date";
    else if (endDate < startDate) errs.endDate = "End date must be after start date";
    if (offeredPrice && Number(offeredPrice) <= 0) errs.offeredPrice = "Enter a valid offer";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    try {
      await createRental({
        assetId: asset.id,
        startDate,
        endDate,
        offeredPrice: offeredPrice ? Number(offeredPrice) : undefined,
        borrowerMessage: message.trim() || undefined,
      });
      onSuccess();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Request rental">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-semibold">Start date</label>
            <input type="date" className="input-base" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            {errors.startDate && <p className="mt-1 text-xs text-destructive">{errors.startDate}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">End date</label>
            <input type="date" className="input-base" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            {errors.endDate && <p className="mt-1 text-xs text-destructive">{errors.endDate}</p>}
          </div>
        </div>
        {days > 0 && (
          <p className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">
            {days} day{days > 1 ? "s" : ""} × {formatPrice(asset.expected_price_per_day)} ={" "}
            <strong>{formatPrice(expected)}</strong> expected
          </p>
        )}
        {asset.price_negotiable && (
          <div>
            <label className="mb-1 block text-sm font-semibold">
              Your offer (₹ total) <span className="font-normal text-muted-foreground">— optional</span>
            </label>
            <input
              type="number"
              min="1"
              className="input-base"
              placeholder={expected ? String(expected) : "3200"}
              value={offeredPrice}
              onChange={(e) => setOfferedPrice(e.target.value)}
            />
            {errors.offeredPrice && <p className="mt-1 text-xs text-destructive">{errors.offeredPrice}</p>}
          </div>
        )}
        <div>
          <label className="mb-1 block text-sm font-semibold">
            Message <span className="font-normal text-muted-foreground">— optional</span>
          </label>
          <textarea
            className="input-base min-h-20"
            placeholder="Tell the owner why you need it…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        <button type="submit" disabled={submitting} className="btn-primary w-full py-3 text-sm">
          {submitting ? "Sending request…" : "Send request"}
        </button>
      </form>
    </Modal>
  );
}
