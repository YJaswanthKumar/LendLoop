import { api, type ApiEnvelope } from "@/api/api";
import { ENDPOINTS } from "@/api/config";
import type { PaginationInfo, Rental } from "@/utils/types";

export interface CreateRentalPayload {
  assetId: string;
  startDate: string;
  endDate: string;
  offeredPrice?: number;
  borrowerMessage?: string;
}

export async function createRental(payload: CreateRentalPayload) {
  const res = await api.post<ApiEnvelope<{ rental: Rental }>>(ENDPOINTS.rentals.root, payload);
  return res.data.data.rental;
}

export async function rentalHistory(params: {
  role?: "owner" | "borrower";
  status?: string;
  page?: number;
  limit?: number;
}) {
  const res = await api.get<ApiEnvelope<{ rentals: Rental[]; pagination: PaginationInfo }>>(
    ENDPOINTS.rentals.history,
    { params },
  );
  return res.data.data;
}

export async function counterOffer(id: string, counterOfferPrice: number, ownerMessage?: string) {
  const res = await api.patch<ApiEnvelope<{ rental: Rental }>>(ENDPOINTS.rentals.counterOffer(id), {
    counterOfferPrice,
    ownerMessage,
  });
  return res.data.data.rental;
}

export async function acceptRental(id: string, agreedPrice?: number) {
  const res = await api.patch<ApiEnvelope<{ rental: Rental }>>(
    ENDPOINTS.rentals.accept(id),
    agreedPrice != null ? { agreedPrice } : {},
  );
  return res.data.data.rental;
}

export async function rejectRental(id: string) {
  const res = await api.patch<ApiEnvelope<{ rental: Rental }>>(ENDPOINTS.rentals.reject(id));
  return res.data.data.rental;
}

export async function cancelRental(id: string) {
  const res = await api.patch<ApiEnvelope<{ rental: Rental }>>(ENDPOINTS.rentals.cancel(id));
  return res.data.data.rental;
}

export async function completeRental(id: string) {
  const res = await api.patch<ApiEnvelope<{ rental: Rental }>>(ENDPOINTS.rentals.complete(id));
  return res.data.data.rental;
}
