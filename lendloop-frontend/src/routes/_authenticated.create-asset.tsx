import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { getApiError } from "@/api/api";
import {
  AssetForm,
  assetToFormValues,
  formValuesToPayload,
  validateAssetForm,
  type AssetFormValues,
} from "@/components/AssetForm";
import { createAsset } from "@/services/assetService";

export const Route = createFileRoute("/_authenticated/create-asset")({
  head: () => ({
    meta: [
      { title: "List an item — LendLoop" },
      { name: "description", content: "List an item for rent on LendLoop and start earning." },
    ],
  }),
  component: CreateAssetPage,
});

function CreateAssetPage() {
  const navigate = useNavigate();
  const [values, setValues] = useState<AssetFormValues>(assetToFormValues());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateAssetForm(values);
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.error("Please fix the highlighted fields");
      return;
    }
    setSubmitting(true);
    try {
      const asset = await createAsset(formValuesToPayload(values));
      toast.success("Your item is now listed!");
      navigate({ to: "/assets/$assetId", params: { assetId: asset.id } });
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-extrabold tracking-tight">List an item</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Share something you own and earn when neighbours rent it.
      </p>
      <div className="card-elevated mt-6 p-6">
        <AssetForm
          values={values}
          setValues={setValues}
          errors={errors}
          submitting={submitting}
          submitLabel="Publish listing"
          onSubmit={onSubmit}
        />
      </div>
    </div>
  );
}
