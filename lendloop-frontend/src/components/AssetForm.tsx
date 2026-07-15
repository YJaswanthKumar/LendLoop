import { useState } from "react";
import { ImagePlus } from "lucide-react";
import { CATEGORIES, type Asset, type CancellationPolicy } from "@/utils/types";
import { CANCELLATION_POLICY_DESCRIPTIONS, CANCELLATION_POLICY_LABELS } from "@/utils/cancellationPolicy";
import { LocationPicker } from "./LocationPicker";

export interface AssetFormValues {
  title: string;
  category: string;
  description: string;
  brand: string;
  condition: string;
  purchaseYear: string;
  expectedPricePerDay: string;
  minimumPrice: string;
  priceNegotiable: boolean;
  securityDeposit: string;
  cancellationPolicy: CancellationPolicy;
  availableFrom: string;
  availableTo: string;
  latitude: number | null;
  longitude: number | null;
  address: string;
  city: string;
  state: string;
  country: string;
  imageUrl: string;
}

export function assetToFormValues(asset?: Asset): AssetFormValues {
  return {
    title: asset?.title ?? "",
    category: asset?.category ?? "",
    description: asset?.description ?? "",
    brand: asset?.brand ?? "",
    condition: asset?.condition ?? "",
    purchaseYear: asset?.purchase_year?.toString() ?? "",
    expectedPricePerDay: asset?.expected_price_per_day?.toString() ?? "",
    minimumPrice: asset?.minimum_price?.toString() ?? "",
    priceNegotiable: asset?.price_negotiable ?? false,
    securityDeposit: asset?.security_deposit?.toString() ?? "",
    cancellationPolicy: asset?.cancellation_policy ?? "MODERATE",
    availableFrom: asset?.available_from ?? "",
    availableTo: asset?.available_to ?? "",
    latitude: asset?.latitude ?? null,
    longitude: asset?.longitude ?? null,
    address: asset?.address ?? "",
    city: asset?.city ?? "",
    state: asset?.state ?? "",
    country: asset?.country ?? "",
    imageUrl: asset?.image_url ?? "",
  };
}

export function formValuesToPayload(v: AssetFormValues): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    title: v.title.trim(),
    category: v.category,
    expectedPricePerDay: Number(v.expectedPricePerDay),
    priceNegotiable: v.priceNegotiable,
    cancellationPolicy: v.cancellationPolicy,
  };
  if (v.description.trim()) payload.description = v.description.trim();
  if (v.brand.trim()) payload.brand = v.brand.trim();
  if (v.condition) payload.condition = v.condition;
  if (v.purchaseYear) payload.purchaseYear = Number(v.purchaseYear);
  if (v.minimumPrice) payload.minimumPrice = Number(v.minimumPrice);
  if (v.securityDeposit) payload.securityDeposit = Number(v.securityDeposit);
  if (v.availableFrom) payload.availableFrom = v.availableFrom;
  if (v.availableTo) payload.availableTo = v.availableTo;
  if (v.latitude != null) payload.latitude = v.latitude;
  if (v.longitude != null) payload.longitude = v.longitude;
  if (v.address.trim()) payload.address = v.address.trim();
  if (v.city.trim()) payload.city = v.city.trim();
  if (v.state.trim()) payload.state = v.state.trim();
  if (v.country.trim()) payload.country = v.country.trim();
  if (v.imageUrl.trim()) payload.imageUrl = v.imageUrl.trim();
  return payload;
}

export function validateAssetForm(v: AssetFormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!v.title.trim()) errors.title = "Title is required";
  if (!v.category) errors.category = "Choose a category";
  if (!v.expectedPricePerDay || Number(v.expectedPricePerDay) <= 0)
    errors.expectedPricePerDay = "Enter a valid daily price";
  if (v.minimumPrice && Number(v.minimumPrice) > Number(v.expectedPricePerDay))
    errors.minimumPrice = "Minimum price cannot exceed the expected price";
  if (v.availableFrom && v.availableTo && v.availableTo < v.availableFrom)
    errors.availableTo = "End date must be after start date";
  if (v.imageUrl && !/^https?:\/\//.test(v.imageUrl.trim()))
    errors.imageUrl = "Image URL must start with http(s)://";
  return errors;
}

const CONDITIONS = ["New", "Like New", "Good", "Fair", "Used"];

export function AssetForm({
  values,
  setValues,
  errors,
  submitting,
  submitLabel,
  onSubmit,
}: {
  values: AssetFormValues;
  setValues: (v: AssetFormValues) => void;
  errors: Record<string, string>;
  submitting: boolean;
  submitLabel: string;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const set = (patch: Partial<AssetFormValues>) => setValues({ ...values, ...patch });

  const field = (name: keyof AssetFormValues, label: string, node: React.ReactNode) => (
    <div>
      <label className="mb-1 block text-sm font-semibold">{label}</label>
      {node}
      {errors[name] && <p className="mt-1 text-xs text-destructive">{errors[name]}</p>}
    </div>
  );

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {/* Image */}
      <div>
        <label className="mb-1 block text-sm font-semibold">Item photo (URL)</label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex h-32 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted sm:w-44">
            {values.imageUrl && !imgError ? (
              <img
                src={values.imageUrl}
                alt="Preview"
                className="h-full w-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <ImagePlus className="h-8 w-8 text-muted-foreground/40" />
            )}
          </div>
          <div className="flex-1">
            <input
              className="input-base"
              placeholder="https://…/photo.jpg"
              value={values.imageUrl}
              onChange={(e) => {
                setImgError(false);
                set({ imageUrl: e.target.value });
              }}
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Paste a public image URL (e.g. from your storage bucket).
            </p>
            {errors.imageUrl && <p className="mt-1 text-xs text-destructive">{errors.imageUrl}</p>}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {field(
          "title",
          "Title *",
          <input
            className="input-base"
            placeholder="Canon EOS R6 Camera"
            value={values.title}
            onChange={(e) => set({ title: e.target.value })}
          />,
        )}
        {field(
          "category",
          "Category *",
          <select
            className="input-base"
            value={values.category}
            onChange={(e) => set({ category: e.target.value })}
          >
            <option value="">Select category</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>,
        )}
        {field(
          "brand",
          "Brand",
          <input
            className="input-base"
            placeholder="Canon"
            value={values.brand}
            onChange={(e) => set({ brand: e.target.value })}
          />,
        )}
        {field(
          "condition",
          "Condition",
          <select
            className="input-base"
            value={values.condition}
            onChange={(e) => set({ condition: e.target.value })}
          >
            <option value="">Select condition</option>
            {CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>,
        )}
      </div>

      {field(
        "description",
        "Description",
        <textarea
          className="input-base min-h-24"
          placeholder="Describe the item, accessories included, pickup instructions…"
          value={values.description}
          onChange={(e) => set({ description: e.target.value })}
        />,
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {field(
          "expectedPricePerDay",
          "Expected price / day (₹) *",
          <input
            type="number"
            min="1"
            className="input-base"
            placeholder="1200"
            value={values.expectedPricePerDay}
            onChange={(e) => set({ expectedPricePerDay: e.target.value })}
          />,
        )}
        {field(
          "minimumPrice",
          "Minimum price (₹)",
          <input
            type="number"
            min="0"
            className="input-base"
            placeholder="900"
            value={values.minimumPrice}
            onChange={(e) => set({ minimumPrice: e.target.value })}
          />,
        )}
        {field(
          "securityDeposit",
          "Security deposit (₹)",
          <input
            type="number"
            min="0"
            className="input-base"
            placeholder="5000"
            value={values.securityDeposit}
            onChange={(e) => set({ securityDeposit: e.target.value })}
          />,
        )}
      </div>

      <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border px-4 py-3">
        <span>
          <span className="block text-sm font-semibold">Price negotiable</span>
          <span className="text-xs text-muted-foreground">Allow renters to make offers</span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={values.priceNegotiable}
          onClick={() => set({ priceNegotiable: !values.priceNegotiable })}
          className={`relative h-6 w-11 rounded-full transition-colors ${values.priceNegotiable ? "bg-primary" : "bg-muted-foreground/30"}`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-all ${values.priceNegotiable ? "left-5.5" : "left-0.5"}`}
          />
        </button>
      </label>

      <div>
        <span className="mb-2 block text-sm font-semibold">Cancellation policy</span>
        <div className="grid gap-2 sm:grid-cols-3">
          {(Object.keys(CANCELLATION_POLICY_LABELS) as CancellationPolicy[]).map((policy) => (
            <button
              key={policy}
              type="button"
              onClick={() => set({ cancellationPolicy: policy })}
              className={`rounded-xl border px-3.5 py-3 text-left transition-colors ${
                values.cancellationPolicy === policy
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted"
              }`}
            >
              <span className="block text-sm font-semibold">{CANCELLATION_POLICY_LABELS[policy]}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {CANCELLATION_POLICY_DESCRIPTIONS[policy]}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {field(
          "availableFrom",
          "Available from",
          <input
            type="date"
            className="input-base"
            value={values.availableFrom}
            onChange={(e) => set({ availableFrom: e.target.value })}
          />,
        )}
        {field(
          "availableTo",
          "Available until",
          <input
            type="date"
            className="input-base"
            value={values.availableTo}
            onChange={(e) => set({ availableTo: e.target.value })}
          />,
        )}
        {field(
          "purchaseYear",
          "Purchase year",
          <input
            type="number"
            min="1990"
            max={new Date().getFullYear()}
            className="input-base"
            placeholder="2023"
            value={values.purchaseYear}
            onChange={(e) => set({ purchaseYear: e.target.value })}
          />,
        )}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-bold">Location</h3>
        <LocationPicker
          value={{ latitude: values.latitude, longitude: values.longitude }}
          onChange={(loc) => set({ latitude: loc.latitude, longitude: loc.longitude })}
        />
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input
            className="input-base"
            placeholder="Address / area"
            value={values.address}
            onChange={(e) => set({ address: e.target.value })}
          />
          <input
            className="input-base"
            placeholder="City"
            value={values.city}
            onChange={(e) => set({ city: e.target.value })}
          />
          <input
            className="input-base"
            placeholder="State"
            value={values.state}
            onChange={(e) => set({ state: e.target.value })}
          />
          <input
            className="input-base"
            placeholder="Country"
            value={values.country}
            onChange={(e) => set({ country: e.target.value })}
          />
        </div>
      </div>

      <button type="submit" disabled={submitting} className="btn-primary w-full py-3 text-sm">
        {submitting ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
