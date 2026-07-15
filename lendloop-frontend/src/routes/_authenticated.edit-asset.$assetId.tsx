import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { getApiError } from "@/api/api";
import {
  AssetForm,
  assetToFormValues,
  formValuesToPayload,
  validateAssetForm,
  type AssetFormValues,
} from "@/components/AssetForm";
import { ErrorState } from "@/components/ErrorState";
import { Loader } from "@/components/Loader";
import { deleteAsset, getAsset, updateAsset } from "@/services/assetService";

export const Route = createFileRoute("/_authenticated/edit-asset/$assetId")({
  head: () => ({
    meta: [
      { title: "Edit listing — LendLoop" },
      { name: "description", content: "Update your LendLoop listing details, price and availability." },
    ],
  }),
  component: EditAssetPage,
});

function EditAssetPage() {
  const { assetId } = Route.useParams();
  const navigate = useNavigate();
  const [values, setValues] = useState<AssetFormValues | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    getAsset(assetId)
      .then((asset) => setValues(assetToFormValues(asset)))
      .catch((err) => setLoadError(getApiError(err)))
      .finally(() => setLoading(false));
  }, [assetId]);

  useEffect(load, [load]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values) return;
    const errs = validateAssetForm(values);
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.error("Please fix the highlighted fields");
      return;
    }
    setSubmitting(true);
    try {
      await updateAsset(assetId, formValuesToPayload(values));
      toast.success("Listing updated");
      navigate({ to: "/assets/$assetId", params: { assetId } });
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async () => {
    if (!window.confirm("Delete this listing? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await deleteAsset(assetId);
      toast.success("Listing deleted");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(getApiError(err));
      setDeleting(false);
    }
  };

  if (loading) return <Loader full label="Loading listing…" />;
  if (loadError || !values)
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <ErrorState message={loadError ?? "Listing not found"} onRetry={load} />
      </div>
    );

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight">Edit listing</h1>
        <button
          onClick={onDelete}
          disabled={deleting}
          className="btn-outline px-4 py-2 text-xs text-destructive"
        >
          {deleting ? "Deleting…" : "Delete listing"}
        </button>
      </div>
      <div className="card-elevated mt-6 p-6">
        <AssetForm
          values={values}
          setValues={setValues}
          errors={errors}
          submitting={submitting}
          submitLabel="Save changes"
          onSubmit={onSubmit}
        />
      </div>
    </div>
  );
}
