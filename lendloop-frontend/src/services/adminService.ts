import { api, type ApiEnvelope } from "@/api/api";
import { ENDPOINTS } from "@/api/config";
import type {
  AdminAnalytics,
  AdminAsset,
  AdminOverview,
  AdminRental,
  AdminReview,
  AdminUser,
  AdminUserDetail,
  ActivityLog,
  PaginationInfo,
} from "@/utils/types";

export async function getAdminOverview() {
  const res = await api.get<ApiEnvelope<{ overview: AdminOverview }>>(ENDPOINTS.admin.overview);
  return res.data.data.overview;
}

export async function getAdminAnalytics() {
  const res = await api.get<ApiEnvelope<{ analytics: AdminAnalytics }>>(ENDPOINTS.admin.analytics);
  return res.data.data.analytics;
}

export async function getActivityFeed(params: { page?: number; limit?: number; type?: string } = {}) {
  const res = await api.get<ApiEnvelope<{ activities: ActivityLog[]; pagination: PaginationInfo }>>(
    ENDPOINTS.admin.activity,
    { params },
  );
  return res.data.data;
}

export interface AdminUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: "true" | "false";
  isAdmin?: "true" | "false";
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export async function listAdminUsers(params: AdminUsersParams = {}) {
  const res = await api.get<ApiEnvelope<{ users: AdminUser[]; pagination: PaginationInfo }>>(
    ENDPOINTS.admin.users,
    { params },
  );
  return res.data.data;
}

export async function getAdminUserDetail(userId: string) {
  const res = await api.get<ApiEnvelope<AdminUserDetail>>(ENDPOINTS.admin.userDetail(userId));
  return res.data.data;
}

export async function setAdminUserStatus(userId: string, isActive: boolean) {
  const res = await api.patch<ApiEnvelope<{ user: AdminUser }>>(ENDPOINTS.admin.userStatus(userId), {
    isActive,
  });
  return res.data.data.user;
}

export interface AdminAssetsParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  availabilityStatus?: string;
  ownerId?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export async function listAdminAssets(params: AdminAssetsParams = {}) {
  const res = await api.get<ApiEnvelope<{ assets: AdminAsset[]; pagination: PaginationInfo }>>(
    ENDPOINTS.admin.assets,
    { params },
  );
  return res.data.data;
}

export async function setAdminAssetHidden(assetId: string, hidden: boolean) {
  const res = await api.patch<ApiEnvelope<{ asset: AdminAsset }>>(ENDPOINTS.admin.assetHidden(assetId), {
    hidden,
  });
  return res.data.data.asset;
}

export async function removeAdminAsset(assetId: string) {
  const res = await api.delete<ApiEnvelope<Record<string, never>>>(ENDPOINTS.admin.assetRemove(assetId));
  return res.data;
}

export async function listAdminRentals(params: { page?: number; limit?: number; status?: string; search?: string } = {}) {
  const res = await api.get<ApiEnvelope<{ rentals: AdminRental[]; pagination: PaginationInfo }>>(
    ENDPOINTS.admin.rentals,
    { params },
  );
  return res.data.data;
}

export async function listAdminReviews(params: { page?: number; limit?: number; minRating?: number; maxRating?: number } = {}) {
  const res = await api.get<ApiEnvelope<{ reviews: AdminReview[]; pagination: PaginationInfo }>>(
    ENDPOINTS.admin.reviews,
    { params },
  );
  return res.data.data;
}

export async function deleteAdminReview(reviewId: string) {
  const res = await api.delete<ApiEnvelope<Record<string, never>>>(ENDPOINTS.admin.reviewDelete(reviewId));
  return res.data;
}
