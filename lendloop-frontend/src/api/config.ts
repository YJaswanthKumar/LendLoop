/**
 * Central API configuration — ALL backend URLs derive from here.
 *
 * Server-side (SSR): talk directly to the backend on localhost, using the
 * same port the backend is configured to listen on (BACKEND_PORT, default
 * 3001 — see lendloop-backend/.env).
 * Client-side (browser): requests go to relative "/api/..." URLs by default,
 * which the frontend's own dev/prod server proxies through to the backend
 * (see vite.config.ts routeRules). Set VITE_API_BASE_URL only if the backend
 * is reachable at a different host/port than the built-in proxy target.
 */
const isServer = typeof window === "undefined";
const backendPort = (import.meta.env.VITE_BACKEND_PORT as string | undefined) ?? "3001";
export const API_BASE_URL: string = isServer
  ? `http://localhost:${backendPort}`
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
    start: (id: string) => `/api/rentals/${id}/start`,
    complete: (id: string) => `/api/rentals/${id}/complete`,
    deposit: (id: string) => `/api/rentals/${id}/deposit`,
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
  wishlist: {
    root: "/api/wishlist",
    ids: "/api/wishlist/ids",
    byAssetId: (assetId: string) => `/api/wishlist/${assetId}`,
  },
  admin: {
    overview: "/api/admin/overview",
    analytics: "/api/admin/analytics",
    activity: "/api/admin/activity",
    users: "/api/admin/users",
    userDetail: (userId: string) => `/api/admin/users/${userId}`,
    userStatus: (userId: string) => `/api/admin/users/${userId}/status`,
    assets: "/api/admin/assets",
    assetHidden: (assetId: string) => `/api/admin/assets/${assetId}/hidden`,
    assetRemove: (assetId: string) => `/api/admin/assets/${assetId}`,
    rentals: "/api/admin/rentals",
    reviews: "/api/admin/reviews",
    reviewDelete: (reviewId: string) => `/api/admin/reviews/${reviewId}`,
  },
} as const;
