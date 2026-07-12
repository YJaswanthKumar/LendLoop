import { api, type ApiEnvelope } from "@/api/api";
import { ENDPOINTS } from "@/api/config";
import type { Asset, PaginationInfo } from "@/utils/types";

export interface AssetListParams {
  page?: number;
  limit?: number;
  category?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  availabilityStatus?: string;
}

interface AssetListResult {
  assets: Asset[];
  pagination: PaginationInfo;
}

export async function listAssets(params: AssetListParams = {}) {
  const res = await api.get<ApiEnvelope<AssetListResult>>(ENDPOINTS.assets.root, { params });
  return res.data.data;
}

export async function searchAssets(q: string, page = 1, limit = 12) {
  const res = await api.get<ApiEnvelope<AssetListResult>>(ENDPOINTS.assets.search, {
    params: { q, page, limit },
  });
  return res.data.data;
}

export async function nearbyAssets(
  latitude: number,
  longitude: number,
  radiusKm = 25,
  page = 1,
  limit = 50,
) {
  const res = await api.get<ApiEnvelope<AssetListResult>>(ENDPOINTS.assets.nearby, {
    params: { latitude, longitude, radiusKm, page, limit },
  });
  return res.data.data;
}

export async function getAsset(id: string) {
  const res = await api.get<ApiEnvelope<{ asset: Asset }>>(ENDPOINTS.assets.byId(id));
  return res.data.data.asset;
}

export async function createAsset(payload: Record<string, unknown>) {
  const res = await api.post<ApiEnvelope<{ asset: Asset }>>(ENDPOINTS.assets.root, payload);
  return res.data.data.asset;
}

export async function updateAsset(id: string, payload: Record<string, unknown>) {
  const res = await api.put<ApiEnvelope<{ asset: Asset }>>(ENDPOINTS.assets.byId(id), payload);
  return res.data.data.asset;
}

export async function deleteAsset(id: string) {
  await api.delete(ENDPOINTS.assets.byId(id));
}
