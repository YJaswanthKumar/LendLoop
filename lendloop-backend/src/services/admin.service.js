const supabase = require('../config/supabase');
const { AppError } = require('../middleware/error.middleware');
const { getPagination, buildPaginationMeta } = require('../utils/helpers');
const { RENTAL_STATUS, ASSET_AVAILABILITY } = require('../utils/constants');
const reviewService = require('./review.service');

const ONLINE_WINDOW_MS = 2 * 60 * 1000; // 2 minutes
const RECENTLY_ACTIVE_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

function presenceStatus(lastSeen) {
  if (!lastSeen) return 'OFFLINE';
  const diff = Date.now() - new Date(lastSeen).getTime();
  if (diff <= ONLINE_WINDOW_MS) return 'ONLINE';
  if (diff <= RECENTLY_ACTIVE_WINDOW_MS) return 'RECENTLY_ACTIVE';
  return 'OFFLINE';
}

function startOfDay(daysAgo = 0) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d;
}

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------
async function getOverview() {
  const [
    { count: totalUsers },
    { count: activeUsers },
    { count: newUsersToday },
    { count: newUsersThisWeek },
    { count: loggedInUsers },
    { count: totalAssets },
    { count: availableAssets },
    { count: bookedAssets },
    { count: completedRentals },
    { count: activeRentals },
    { count: pendingRequests },
    { count: totalReviews },
    { data: ratingRows },
  ] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('users').select('id', { count: 'exact', head: true }).gte('created_at', startOfDay(0).toISOString()),
    supabase.from('users').select('id', { count: 'exact', head: true }).gte('created_at', startOfDay(6).toISOString()),
    supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .gte('last_seen', new Date(Date.now() - ONLINE_WINDOW_MS).toISOString()),
    supabase.from('assets').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase
      .from('assets')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('availability_status', ASSET_AVAILABILITY.AVAILABLE),
    supabase
      .from('assets')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('availability_status', ASSET_AVAILABILITY.BOOKED),
    supabase.from('rentals').select('id', { count: 'exact', head: true }).eq('status', RENTAL_STATUS.COMPLETED),
    supabase
      .from('rentals')
      .select('id', { count: 'exact', head: true })
      .in('status', [RENTAL_STATUS.ACCEPTED, RENTAL_STATUS.ACTIVE]),
    supabase
      .from('rentals')
      .select('id', { count: 'exact', head: true })
      .in('status', [RENTAL_STATUS.REQUESTED, RENTAL_STATUS.NEGOTIATING]),
    supabase.from('reviews').select('id', { count: 'exact', head: true }),
    supabase.from('reviews').select('rating'),
  ]);

  const averagePlatformRating = ratingRows && ratingRows.length
    ? Number((ratingRows.reduce((sum, r) => sum + Number(r.rating), 0) / ratingRows.length).toFixed(2))
    : 0;

  return {
    totalUsers: totalUsers || 0,
    activeUsers: activeUsers || 0,
    newUsersToday: newUsersToday || 0,
    newUsersThisWeek: newUsersThisWeek || 0,
    loggedInUsers: loggedInUsers || 0,
    totalAssets: totalAssets || 0,
    availableAssets: availableAssets || 0,
    bookedAssets: bookedAssets || 0,
    completedRentals: completedRentals || 0,
    activeRentals: activeRentals || 0,
    pendingRequests: pendingRequests || 0,
    totalReviews: totalReviews || 0,
    averagePlatformRating,
    totalDisputes: 0, // future-ready placeholder — no disputes table yet
  };
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
async function getUsers(query) {
  const { page, limit, from, to } = getPagination(query);
  const { search, isActive, isAdmin, sortBy = 'created_at', sortDir = 'desc' } = query;

  let builder = supabase.from('users').select('*', { count: 'exact' });

  if (search) {
    builder = builder.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  }
  if (isActive !== undefined) builder = builder.eq('is_active', isActive === 'true');
  if (isAdmin !== undefined) builder = builder.eq('is_admin', isAdmin === 'true');

  const allowedSort = ['created_at', 'full_name', 'trust_score', 'average_rating', 'rentals_completed', 'total_assets', 'last_seen'];
  const sortColumn = allowedSort.includes(sortBy) ? sortBy : 'created_at';

  const { data, error, count } = await builder
    .order(sortColumn, { ascending: sortDir === 'asc' })
    .range(from, to);

  if (error) {
    throw new AppError('Failed to fetch users', 500);
  }

  const users = (data || []).map((u) => {
    const { password_hash, ...safe } = u;
    return { ...safe, presence: presenceStatus(u.last_seen) };
  });

  return { users, pagination: buildPaginationMeta(page, limit, count) };
}

async function getUserDetail(userId) {
  const { data: user, error } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();

  if (error) {
    throw new AppError('Failed to fetch user', 500);
  }
  if (!user) {
    throw new AppError('User not found', 404);
  }
  const { password_hash, ...safeUser } = user;

  const [
    { data: assetsListed },
    { data: rentalsGiven },
    { data: rentalsTaken },
    { data: reviewsReceived },
    { data: reviewsGiven },
    { data: recentNotifications },
  ] = await Promise.all([
    supabase.from('assets').select('*').eq('owner_id', userId).order('created_at', { ascending: false }),
    supabase.from('rentals').select('*').eq('owner_id', userId).order('created_at', { ascending: false }),
    supabase.from('rentals').select('*').eq('borrower_id', userId).order('created_at', { ascending: false }),
    supabase.from('reviews').select('*').eq('receiver_id', userId).order('created_at', { ascending: false }),
    supabase.from('reviews').select('*').eq('reviewer_id', userId).order('created_at', { ascending: false }),
    supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
  ]);

  return {
    user: { ...safeUser, presence: presenceStatus(user.last_seen) },
    assetsListed: assetsListed || [],
    rentalsGiven: rentalsGiven || [],
    rentalsTaken: rentalsTaken || [],
    reviewsReceived: reviewsReceived || [],
    reviewsGiven: reviewsGiven || [],
    recentNotifications: recentNotifications || [],
    stats: {
      itemsListed: (assetsListed || []).length,
      itemsLent: (rentalsGiven || []).filter((r) => r.status === RENTAL_STATUS.COMPLETED).length,
      itemsBorrowed: (rentalsTaken || []).filter((r) => r.status === RENTAL_STATUS.COMPLETED).length,
      reviewCount: (reviewsReceived || []).length,
    },
  };
}

async function setUserActiveStatus(userId, isActive) {
  const { data: updated, error } = await supabase
    .from('users')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw new AppError('Failed to update user status', 500);
  }
  const { password_hash, ...safe } = updated;
  return safe;
}

// ---------------------------------------------------------------------------
// Assets
// ---------------------------------------------------------------------------
async function getAssetsAdmin(query) {
  const { page, limit, from, to } = getPagination(query);
  const { search, category, availabilityStatus, ownerId, sortBy = 'created_at', sortDir = 'desc' } = query;

  let builder = supabase.from('assets').select('*', { count: 'exact' });

  if (search) builder = builder.or(`title.ilike.%${search}%,category.ilike.%${search}%,brand.ilike.%${search}%`);
  if (category) builder = builder.eq('category', category);
  if (availabilityStatus) builder = builder.eq('availability_status', availabilityStatus);
  if (ownerId) builder = builder.eq('owner_id', ownerId);

  const allowedSort = ['created_at', 'usage_count', 'average_rating', 'expected_price_per_day', 'title'];
  const sortColumn = allowedSort.includes(sortBy) ? sortBy : 'created_at';

  const { data, error, count } = await builder.order(sortColumn, { ascending: sortDir === 'asc' }).range(from, to);

  if (error) {
    throw new AppError('Failed to fetch assets', 500);
  }

  const ownerIds = [...new Set((data || []).map((a) => a.owner_id))];
  const { data: owners } = ownerIds.length
    ? await supabase.from('users').select('id, full_name, email').in('id', ownerIds)
    : { data: [] };
  const ownerMap = new Map((owners || []).map((o) => [o.id, o]));

  const assets = (data || []).map((a) => ({ ...a, owner: ownerMap.get(a.owner_id) || null }));

  return { assets, pagination: buildPaginationMeta(page, limit, count) };
}

async function setAssetHidden(assetId, hidden) {
  const { data: updated, error } = await supabase
    .from('assets')
    .update({ admin_hidden: hidden, updated_at: new Date().toISOString() })
    .eq('id', assetId)
    .select()
    .single();

  if (error) {
    throw new AppError('Failed to update asset visibility', 500);
  }
  return updated;
}

async function removeAssetAdmin(assetId) {
  const { data: updated, error } = await supabase
    .from('assets')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', assetId)
    .select()
    .single();

  if (error) {
    throw new AppError('Failed to remove asset', 500);
  }
  return updated;
}

// ---------------------------------------------------------------------------
// Rentals
// ---------------------------------------------------------------------------
async function getRentalsAdmin(query) {
  const { page, limit, from, to } = getPagination(query);
  const { status, search } = query;

  let builder = supabase.from('rentals').select('*', { count: 'exact' });
  if (status) builder = builder.eq('status', status);

  const { data, error, count } = await builder.order('created_at', { ascending: false }).range(from, to);

  if (error) {
    throw new AppError('Failed to fetch rentals', 500);
  }

  let rentals = data || [];

  const userIds = [...new Set(rentals.flatMap((r) => [r.owner_id, r.borrower_id]))];
  const assetIds = [...new Set(rentals.map((r) => r.asset_id))];

  const [{ data: users }, { data: assets }] = await Promise.all([
    userIds.length ? supabase.from('users').select('id, full_name, email').in('id', userIds) : { data: [] },
    assetIds.length ? supabase.from('assets').select('id, title, category').in('id', assetIds) : { data: [] },
  ]);

  const userMap = new Map((users || []).map((u) => [u.id, u]));
  const assetMap = new Map((assets || []).map((a) => [a.id, a]));

  rentals = rentals.map((r) => ({
    ...r,
    owner: userMap.get(r.owner_id) || null,
    borrower: userMap.get(r.borrower_id) || null,
    asset: assetMap.get(r.asset_id) || null,
  }));

  if (search) {
    const q = search.toLowerCase();
    rentals = rentals.filter(
      (r) =>
        r.asset?.title?.toLowerCase().includes(q) ||
        r.owner?.full_name?.toLowerCase().includes(q) ||
        r.borrower?.full_name?.toLowerCase().includes(q)
    );
  }

  return { rentals, pagination: buildPaginationMeta(page, limit, count) };
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------
async function getReviewsAdmin(query) {
  const { page, limit, from, to } = getPagination(query);
  const { minRating, maxRating } = query;

  let builder = supabase.from('reviews').select('*', { count: 'exact' });
  if (minRating) builder = builder.gte('rating', minRating);
  if (maxRating) builder = builder.lte('rating', maxRating);

  const { data, error, count } = await builder.order('created_at', { ascending: false }).range(from, to);

  if (error) {
    throw new AppError('Failed to fetch reviews', 500);
  }

  const reviews = data || [];
  const userIds = [...new Set(reviews.flatMap((r) => [r.reviewer_id, r.receiver_id]))];
  const { data: users } = userIds.length
    ? await supabase.from('users').select('id, full_name, email').in('id', userIds)
    : { data: [] };
  const userMap = new Map((users || []).map((u) => [u.id, u]));

  const enriched = reviews.map((r) => ({
    ...r,
    reviewer: userMap.get(r.reviewer_id) || null,
    receiver: userMap.get(r.receiver_id) || null,
  }));

  return { reviews: enriched, pagination: buildPaginationMeta(page, limit, count) };
}

async function deleteReviewAdmin(reviewId) {
  const { data: review, error: fetchError } = await supabase
    .from('reviews')
    .select('*')
    .eq('id', reviewId)
    .maybeSingle();

  if (fetchError) {
    throw new AppError('Failed to fetch review', 500);
  }
  if (!review) {
    throw new AppError('Review not found', 404);
  }

  const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
  if (error) {
    throw new AppError('Failed to delete review', 500);
  }

  await reviewService.recalculateAverageRating(review.receiver_id);

  return true;
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------
async function getAnalytics() {
  const [{ data: assets }, { data: rentals }, { data: users }] = await Promise.all([
    supabase.from('assets').select('id, category, usage_count, owner_id, average_rating, title').eq('is_active', true),
    supabase.from('rentals').select('id, status, owner_id, borrower_id, created_at'),
    supabase.from('users').select('id, created_at, full_name'),
  ]);

  // Most rented categories
  const categoryUsage = {};
  (assets || []).forEach((a) => {
    const cat = a.category || 'Uncategorized';
    categoryUsage[cat] = (categoryUsage[cat] || 0) + (a.usage_count || 0);
  });
  const mostRentedCategories = Object.entries(categoryUsage)
    .map(([category, usage]) => ({ category, usage }))
    .sort((a, b) => b.usage - a.usage)
    .slice(0, 8);

  // Top rented assets
  const topRentedAssets = [...(assets || [])]
    .sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))
    .slice(0, 8)
    .map((a) => ({ id: a.id, title: a.title, usageCount: a.usage_count || 0, rating: a.average_rating || 0 }));

  // Top owners by number of assets
  const ownerAssetCount = {};
  (assets || []).forEach((a) => {
    ownerAssetCount[a.owner_id] = (ownerAssetCount[a.owner_id] || 0) + 1;
  });
  const topOwnerIds = Object.entries(ownerAssetCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([id]) => id);

  // Most active borrowers by number of rentals
  const borrowerRentalCount = {};
  (rentals || []).forEach((r) => {
    borrowerRentalCount[r.borrower_id] = (borrowerRentalCount[r.borrower_id] || 0) + 1;
  });
  const topBorrowerIds = Object.entries(borrowerRentalCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([id]) => id);

  const nameLookupIds = [...new Set([...topOwnerIds, ...topBorrowerIds])];
  const { data: nameRows } = nameLookupIds.length
    ? await supabase.from('users').select('id, full_name').in('id', nameLookupIds)
    : { data: [] };
  const nameMap = new Map((nameRows || []).map((u) => [u.id, u.full_name]));

  const topOwners = topOwnerIds.map((id) => ({ userId: id, name: nameMap.get(id) || 'Unknown', assetsListed: ownerAssetCount[id] }));
  const mostActiveBorrowers = topBorrowerIds.map((id) => ({ userId: id, name: nameMap.get(id) || 'Unknown', rentalsMade: borrowerRentalCount[id] }));

  // New users by day (last 14 days)
  const newUsersByDay = [];
  for (let i = 13; i >= 0; i -= 1) {
    const dayStart = startOfDay(i);
    const dayEnd = startOfDay(i - 1);
    const count = (users || []).filter((u) => {
      const created = new Date(u.created_at);
      return created >= dayStart && created < dayEnd;
    }).length;
    newUsersByDay.push({ date: dayStart.toISOString().slice(0, 10), count });
  }

  // Rental growth by day (last 14 days)
  const rentalGrowthByDay = [];
  for (let i = 13; i >= 0; i -= 1) {
    const dayStart = startOfDay(i);
    const dayEnd = startOfDay(i - 1);
    const count = (rentals || []).filter((r) => {
      const created = new Date(r.created_at);
      return created >= dayStart && created < dayEnd;
    }).length;
    rentalGrowthByDay.push({ date: dayStart.toISOString().slice(0, 10), count });
  }

  const statusBreakdown = {};
  (rentals || []).forEach((r) => {
    statusBreakdown[r.status] = (statusBreakdown[r.status] || 0) + 1;
  });

  return {
    mostRentedCategories,
    topRentedAssets,
    topOwners,
    mostActiveBorrowers,
    newUsersByDay,
    rentalGrowthByDay,
    platformUsage: statusBreakdown,
  };
}

module.exports = {
  getOverview,
  getUsers,
  getUserDetail,
  setUserActiveStatus,
  getAssetsAdmin,
  setAssetHidden,
  removeAssetAdmin,
  getRentalsAdmin,
  getReviewsAdmin,
  deleteReviewAdmin,
  getAnalytics,
  presenceStatus,
};
