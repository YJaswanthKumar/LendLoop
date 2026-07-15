export type AvailabilityStatus = "AVAILABLE" | "BOOKED" | "UNAVAILABLE";
export type RentalStatus =
  | "REQUESTED"
  | "NEGOTIATING"
  | "ACCEPTED"
  | "ACTIVE"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED";
export type NotificationType =
  | "REQUEST"
  | "COUNTER_OFFER"
  | "ACCEPTED"
  | "REJECTED"
  | "ACTIVE"
  | "COMPLETED"
  | "CANCELLED"
  | "DEPOSIT"
  | "WISHLIST"
  | "MESSAGE"
  | "DISPUTE"
  | "GENERAL";

export type CancellationPolicy = "FLEXIBLE" | "MODERATE" | "STRICT";
export type DepositStatus = "NONE" | "PENDING" | "HELD" | "REFUNDED" | "PARTIALLY_REFUNDED" | "FORFEITED";
export type Presence = "ONLINE" | "RECENTLY_ACTIVE" | "OFFLINE";

export interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  profile_image: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  trust_score: number;
  average_rating: number;
  rentals_completed: number;
  rentals_taken: number;
  total_assets: number;
  is_verified: boolean;
  is_active: boolean;
  is_admin?: boolean;
  last_seen?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  owner_id: string;
  title: string;
  category: string;
  description: string | null;
  brand: string | null;
  condition: string | null;
  purchase_year: number | null;
  expected_price_per_day: number;
  minimum_price: number | null;
  price_negotiable: boolean;
  security_deposit: number | null;
  cancellation_policy: CancellationPolicy;
  availability_status: AvailabilityStatus;
  available_from: string | null;
  available_to: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  image_url: string | null;
  usage_count: number;
  average_rating: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  distance_km?: number;
}

// Only present once the rental is ACCEPTED/ACTIVE/COMPLETED — the backend hides
// contact/location details before that.
export interface OwnerContact {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface BorrowerContact {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  city: string | null;
  state: string | null;
}

export interface Rental {
  id: string;
  asset_id: string;
  owner_id: string;
  borrower_id: string;
  request_date: string;
  start_date: string;
  end_date: string;
  total_days: number;
  expected_price: number;
  offered_price: number | null;
  counter_offer_price: number | null;
  agreed_price: number | null;
  security_deposit: number | null;
  cancellation_policy: CancellationPolicy | null;
  cancelled_by: string | null;
  cancellation_reason: string | null;
  refund_amount: number | null;
  cancelled_at: string | null;
  deposit_status: DepositStatus;
  deposit_refund_amount: number | null;
  deposit_notes: string | null;
  deposit_resolved_at: string | null;
  owner_message: string | null;
  borrower_message: string | null;
  status: RentalStatus;
  created_at: string;
  updated_at: string;
  asset?: Asset;
  owner_contact?: OwnerContact | null;
  borrower_contact?: BorrowerContact | null;
}

export interface Review {
  id: string;
  rental_id: string;
  reviewer_id: string;
  receiver_id: string;
  rating: number;
  review: string | null;
  created_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
}

export interface WishlistItem extends Asset {
  wishlisted_at: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface DashboardOverview {
  totalAssets: number;
  rentalsCompleted: number;
  rentalsTaken: number;
  trustScore: number;
  averageRating: number;
  activeRentals: number;
  pendingRequests: number;
}

export interface DashboardAnalytics {
  totalRentals: number;
  statusBreakdown: Record<string, number>;
  totalEarnings: number;
  totalSpent: number;
}

export const CATEGORIES = [
  "Electronics",
  "Cameras",
  "Laptops",
  "Tools",
  "Books",
  "Sports Equipment",
  "Home Appliances",
  "Musical Instruments",
  "Furniture",
  "Other",
] as const;

// ---------------------------------------------------------------------------
// Admin portal
// ---------------------------------------------------------------------------
export interface AdminUser extends User {
  presence: Presence;
}

export interface AdminOverview {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  loggedInUsers: number;
  totalAssets: number;
  availableAssets: number;
  bookedAssets: number;
  completedRentals: number;
  activeRentals: number;
  pendingRequests: number;
  totalReviews: number;
  averagePlatformRating: number;
  totalDisputes: number;
}

export interface ActivityLog {
  id: string;
  type: string;
  message: string;
  user_id: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
}

export interface AdminUserDetail {
  user: AdminUser;
  assetsListed: Asset[];
  rentalsGiven: Rental[];
  rentalsTaken: Rental[];
  reviewsReceived: Review[];
  reviewsGiven: Review[];
  recentNotifications: AppNotification[];
  stats: {
    itemsListed: number;
    itemsLent: number;
    itemsBorrowed: number;
    reviewCount: number;
  };
}

export interface AdminAsset extends Asset {
  admin_hidden?: boolean;
  owner: { id: string; full_name: string; email: string } | null;
}

export interface AdminRental extends Omit<Rental, "asset"> {
  owner: { id: string; full_name: string; email: string } | null;
  borrower: { id: string; full_name: string; email: string } | null;
  asset: { id: string; title: string; category: string } | null;
}

export interface AdminReview extends Review {
  reviewer: { id: string; full_name: string; email: string } | null;
  receiver: { id: string; full_name: string; email: string } | null;
}

export interface AdminAnalytics {
  mostRentedCategories: { category: string; usage: number }[];
  topRentedAssets: { id: string; title: string; usageCount: number; rating: number }[];
  topOwners: { userId: string; name: string; assetsListed: number }[];
  mostActiveBorrowers: { userId: string; name: string; rentalsMade: number }[];
  newUsersByDay: { date: string; count: number }[];
  rentalGrowthByDay: { date: string; count: number }[];
  platformUsage: Record<string, number>;
}
