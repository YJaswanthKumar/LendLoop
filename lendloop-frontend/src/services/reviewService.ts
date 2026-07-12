import { api, type ApiEnvelope } from "@/api/api";
import { ENDPOINTS } from "@/api/config";
import type { PaginationInfo, Review } from "@/utils/types";

export async function createReview(payload: {
  rentalId: string;
  receiverId: string;
  rating: number;
  review?: string;
}) {
  const res = await api.post<ApiEnvelope<{ review: Review }>>(ENDPOINTS.reviews.root, payload);
  return res.data.data.review;
}

export async function reviewsForUser(userId: string, page = 1, limit = 10) {
  const res = await api.get<
    ApiEnvelope<{ reviews: Review[]; averageRating: number; pagination: PaginationInfo }>
  >(ENDPOINTS.reviews.forUser(userId), { params: { page, limit } });
  return res.data.data;
}
