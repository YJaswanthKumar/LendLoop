import axios, { AxiosError } from "axios";
import { API_BASE_URL, TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from "./config";

/** Shared Axios instance. Attaches the JWT from localStorage on every request. */
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    // Expired/invalid session → clear and send to login
    if (
      typeof window !== "undefined" &&
      error.response?.status === 401 &&
      window.localStorage.getItem(TOKEN_STORAGE_KEY) &&
      !error.config?.url?.includes("/api/auth/login")
    ) {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      window.localStorage.removeItem(USER_STORAGE_KEY);
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: { field: string; message: string }[];
}

/** Extract a human-readable message from any API/network error. */
export function getApiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as ApiEnvelope<unknown> | undefined;
    if (data?.errors?.length) return data.errors.map((e) => e.message).join(". ");
    if (data?.message) return data.message;
    if (err.code === "ERR_NETWORK") return "Cannot reach the LendLoop server. Is the backend running?";
    return err.message;
  }
  return err instanceof Error ? err.message : "Something went wrong";
}
