import { api, type ApiEnvelope } from "@/api/api";
import { ENDPOINTS } from "@/api/config";
import type { AppNotification, PaginationInfo } from "@/utils/types";

export async function listNotifications(params: {
  isRead?: boolean;
  page?: number;
  limit?: number;
} = {}) {
  const res = await api.get<
    ApiEnvelope<{ notifications: AppNotification[]; pagination: PaginationInfo }>
  >(ENDPOINTS.notifications.root, { params });
  return res.data.data;
}

export async function markNotificationRead(id: string) {
  const res = await api.patch<ApiEnvelope<{ notification: AppNotification }>>(
    ENDPOINTS.notifications.markRead(id),
  );
  return res.data.data.notification;
}
