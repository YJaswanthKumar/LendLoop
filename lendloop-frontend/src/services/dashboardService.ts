import { api, type ApiEnvelope } from "@/api/api";
import { ENDPOINTS } from "@/api/config";
import type { Asset, DashboardAnalytics, DashboardOverview, Rental } from "@/utils/types";

export async function getOverview() {
  const res = await api.get<ApiEnvelope<{ overview: DashboardOverview }>>(
    ENDPOINTS.dashboard.overview,
  );
  return res.data.data.overview;
}

export async function getTrendingCategories() {
  const res = await api.get<
    ApiEnvelope<{ categories: { category: string; totalUsage: number }[] }>
  >(ENDPOINTS.dashboard.trendingCategories);
  return res.data.data.categories;
}

export async function getTrendingAssets() {
  const res = await api.get<ApiEnvelope<{ assets: Asset[] }>>(ENDPOINTS.dashboard.trendingAssets);
  return res.data.data.assets;
}

export async function getRecentRentals(limit = 5) {
  const res = await api.get<ApiEnvelope<{ rentals: Rental[] }>>(
    ENDPOINTS.dashboard.recentRentals,
    { params: { limit } },
  );
  return res.data.data.rentals;
}

export async function getAnalytics() {
  const res = await api.get<ApiEnvelope<{ analytics: DashboardAnalytics }>>(
    ENDPOINTS.dashboard.analytics,
  );
  return res.data.data.analytics;
}
