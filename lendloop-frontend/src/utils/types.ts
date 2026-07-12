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
  | "GENERAL";

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
  owner_message: string | null;
  borrower_message: string | null;
  status: RentalStatus;
  created_at: string;
  updated_at: string;
  asset?: Asset;
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
