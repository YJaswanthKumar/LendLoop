import { api, type ApiEnvelope } from "@/api/api";
import { ENDPOINTS } from "@/api/config";
import type { User } from "@/utils/types";

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

export async function registerUser(payload: RegisterPayload) {
  const res = await api.post<ApiEnvelope<{ user: User; token: string }>>(
    ENDPOINTS.auth.register,
    payload,
  );
  return res.data.data;
}

export async function loginUser(email: string, password: string) {
  const res = await api.post<ApiEnvelope<{ user: User; token: string }>>(ENDPOINTS.auth.login, {
    email,
    password,
  });
  return res.data.data;
}

export async function fetchProfile() {
  const res = await api.get<ApiEnvelope<{ user: User }>>(ENDPOINTS.auth.profile);
  return res.data.data.user;
}
