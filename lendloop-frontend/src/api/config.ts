/**
 * Central API configuration — ALL backend URLs derive from here.
 *
 * Server-side (SSR): talk directly to the backend on localhost:3001.
 * Client-side (browser): use VITE_API_BASE_URL (the public Replit dev-domain
 * URL for the backend port) so the browser can reach the backend through
 * Replit's proxy.
 */
const isServer = typeof window === "undefined";
export const API_BASE_URL: string = isServer
  ? "http://localhost:3001"
  : (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";


export const TOKEN_STORAGE_KEY = "lendloop_token";
export const USER_STORAGE_KEY = "lendloop_user";

export const ENDPOINTS = {
  health: "/health",
  auth: {
    register: "/api/auth/register",
    login: "/api/auth/login",
    profile: "/api/auth/profile",
  },
  assets: {
    root: "/api/assets",
    nearby: "/api/assets/nearby",
    search: "/api/assets/search",
    byId: (id: string) => `/api/assets/${id}`,
  },
  rentals: {
    root: "/api/rentals",
    history: "/api/rentals/history",
    counterOffer: (id: string) => `/api/rentals/${id}/counter-offer`,
    accept: (id: string) => `/api/rentals/${id}/accept`,
    reject: (id: string) => `/api/rentals/${id}/reject`,
    cancel: (id: string) => `/api/rentals/${id}/cancel`,
    complete: (id: string) => `/api/rentals/${id}/complete`,
  },
  reviews: {
    root: "/api/reviews",
    forUser: (userId: string) => `/api/reviews/user/${userId}`,
  },
  notifications: {
    root: "/api/notifications",
    markRead: (id: string) => `/api/notifications/${id}/read`,
  },
  dashboard: {
    overview: "/api/dashboard/overview",
    trendingCategories: "/api/dashboard/trending-categories",
    trendingAssets: "/api/dashboard/trending-assets",
    recentRentals: "/api/dashboard/recent-rentals",
    analytics: "/api/dashboard/analytics",
  },
} as const;
