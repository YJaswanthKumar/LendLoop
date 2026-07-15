import { getAsset } from "@/services/assetService";
import type { Asset, Rental } from "@/utils/types";

/**
 * The rentals API returns raw rental rows. Attach the related asset so the UI
 * can show titles/images. Fetches each unique asset once, tolerates failures.
 */
export async function enrichRentalsWithAssets(rentals: Rental[]): Promise<Rental[]> {
  const missing = [...new Set(rentals.filter((r) => !r.asset).map((r) => r.asset_id))];
  const map = new Map<string, Asset>();
  await Promise.all(
    missing.map(async (id) => {
      try {
        map.set(id, await getAsset(id));
      } catch {
        // asset may be deleted — show a fallback
      }
    }),
  );
  return rentals.map((r) => (r.asset ? r : { ...r, asset: map.get(r.asset_id) }));
}
