import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck, Boxes, HandCoins, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { getApiError } from "@/api/api";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Loader } from "@/components/Loader";
import { StarRating } from "@/components/StarRating";
import { useAuth } from "@/context/AuthContext";
import { fetchProfile } from "@/services/authService";
import { reviewsForUser } from "@/services/reviewService";
import { formatDate, initials } from "@/utils/format";
import type { Review, User } from "@/utils/types";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "My profile — ROL" },
      { name: "description", content: "Your ROL profile: personal details, trust score, ratings and reviews." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user: cachedUser } = useAuth();
  const [profile, setProfile] = useState<User | null>(cachedUser);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fresh = await fetchProfile();
      setProfile(fresh);
      const rev = await reviewsForUser(fresh.id, 1, 10);
      setReviews(rev.reviews);
      setAvgRating(rev.averageRating);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !profile) return <Loader full label="Loading profile…" />;
  if (error && !profile)
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <ErrorState message={error} onRetry={load} />
      </div>
    );
  if (!profile) return null;

  const stats = [
    { icon: Boxes, label: "Assets listed", value: profile.total_assets },
    { icon: HandCoins, label: "Rentals completed", value: profile.rentals_completed },
    { icon: BadgeCheck, label: "Rentals taken", value: profile.rentals_taken },
    { icon: ShieldCheck, label: "Trust score", value: profile.trust_score },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="card-elevated flex flex-col items-center gap-5 p-6 sm:flex-row sm:items-start">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent text-3xl font-extrabold text-accent-foreground">
          {profile.profile_image ? (
            <img src={profile.profile_image} alt={profile.full_name} className="h-full w-full object-cover" />
          ) : (
            initials(profile.full_name)
          )}
        </div>
        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <h1 className="text-2xl font-extrabold tracking-tight">{profile.full_name}</h1>
            {profile.is_verified && <BadgeCheck className="h-5 w-5 text-primary" />}
          </div>
          <div className="mt-1 flex items-center justify-center gap-2 sm:justify-start">
            <StarRating value={avgRating || profile.average_rating} />
            <span className="text-sm text-muted-foreground">
              {(avgRating || profile.average_rating || 0).toFixed(1)} · {reviews.length} review{reviews.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
            <p className="flex items-center justify-center gap-2 sm:justify-start">
              <Mail className="h-4 w-4" /> {profile.email}
            </p>
            {profile.phone && (
              <p className="flex items-center justify-center gap-2 sm:justify-start">
                <Phone className="h-4 w-4" /> {profile.phone}
              </p>
            )}
            {(profile.city || profile.country) && (
              <p className="flex items-center justify-center gap-2 sm:justify-start">
                <MapPin className="h-4 w-4" />
                {[profile.city, profile.state, profile.country].filter(Boolean).join(", ")}
              </p>
            )}
            <p className="text-xs">Member since {formatDate(profile.created_at)}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card-elevated p-4 text-center">
            <s.icon className="mx-auto h-5 w-5 text-primary" />
            <p className="mt-2 text-2xl font-extrabold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <h2 className="mb-3 mt-8 text-lg font-bold">Reviews</h2>
      {reviews.length === 0 ? (
        <EmptyState
          title="No reviews yet"
          description="Complete rentals to start collecting reviews and build your trust score."
        />
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="card-elevated p-4">
              <div className="flex items-center justify-between">
                <StarRating value={r.rating} size={14} />
                <span className="text-xs text-muted-foreground">{formatDate(r.created_at)}</span>
              </div>
              {r.review && <p className="mt-2 text-sm text-muted-foreground">{r.review}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
