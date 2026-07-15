import { api, type ApiEnvelope } from "@/api/api";
import { ENDPOINTS } from "@/api/config";
import type { PaginationInfo, WishlistItem } from "@/utils/types";

export async function getWishlist(params: { page?: number; limit?: number } = {}) {
  const res = await api.get<ApiEnvelope<{ assets: WishlistItem[]; pagination: PaginationInfo }>>(
    ENDPOINTS.wishlist.root,
    { params },
  );
  return res.data.data;
}

export async function getWishlistedAssetIds() {
  const res = await api.get<ApiEnvelope<{ assetIds: string[] }>>(ENDPOINTS.wishlist.ids);
  return res.data.data.assetIds;
}

export async function addToWishlist(assetId: string) {
  await api.post(ENDPOINTS.wishlist.root, { assetId });
}

export async function removeFromWishlist(assetId: string) {
  await api.delete(ENDPOINTS.wishlist.byAssetId(assetId));
}
