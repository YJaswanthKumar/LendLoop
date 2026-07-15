const supabase = require('../config/supabase');
const { AppError } = require('../middleware/error.middleware');
const { RENTAL_STATUS } = require('../utils/constants');

async function getOverview(userId) {
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('total_assets, rentals_completed, rentals_taken, trust_score, average_rating')
    .eq('id', userId)
    .maybeSingle();

  if (userError || !user) {
    throw new AppError('Failed to fetch dashboard overview', 500);
  }

  const { count: activeRentalsCount, error: activeError } = await supabase
    .from('rentals')
    .select('id', { count: 'exact', head: true })
    .or(`owner_id.eq.${userId},borrower_id.eq.${userId}`)
    .in('status', [RENTAL_STATUS.ACCEPTED, RENTAL_STATUS.ACTIVE]);

  if (activeError) {
    throw new AppError('Failed to fetch active rentals count', 500);
  }

  const { count: pendingRequestsCount, error: pendingError } = await supabase
    .from('rentals')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', userId)
    .in('status', [RENTAL_STATUS.REQUESTED, RENTAL_STATUS.NEGOTIATING]);

  if (pendingError) {
    throw new AppError('Failed to fetch pending requests count', 500);
  }

  return {
    totalAssets: user.total_assets || 0,
    rentalsCompleted: user.rentals_completed || 0,
    rentalsTaken: user.rentals_taken || 0,
    trustScore: user.trust_score || 0,
    averageRating: user.average_rating || 0,
    activeRentals: activeRentalsCount || 0,
    pendingRequests: pendingRequestsCount || 0,
  };
}

async function getTrendingCategories() {
  const { data: assets, error } = await supabase
    .from('assets')
    .select('category, usage_count')
    .eq('is_active', true);

  if (error) {
    throw new AppError('Failed to fetch trending categories', 500);
  }

  const grouped = {};
  assets.forEach((asset) => {
    const category = asset.category || 'Uncategorized';
    grouped[category] = (grouped[category] || 0) + (asset.usage_count || 0);
  });

  const trending = Object.entries(grouped)
    .map(([category, totalUsage]) => ({ category, totalUsage }))
    .sort((a, b) => b.totalUsage - a.totalUsage)
    .slice(0, 10);

  return trending;
}

async function getTrendingAssets() {
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('is_active', true)
    .order('usage_count', { ascending: false })
    .order('average_rating', { ascending: false })
    .limit(10);

  if (error) {
    throw new AppError('Failed to fetch trending assets', 500);
  }

  return data;
}

async function getRecentRentals(userId, limit = 10) {
  const { data, error } = await supabase
    .from('rentals')
    .select('*')
    .or(`owner_id.eq.${userId},borrower_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new AppError('Failed to fetch recent rentals', 500);
  }

  return data;
}

async function getAnalytics(userId) {
  const { data: rentals, error } = await supabase
    .from('rentals')
    .select('status, agreed_price, owner_id, borrower_id, created_at')
    .or(`owner_id.eq.${userId},borrower_id.eq.${userId}`);

  if (error) {
    throw new AppError('Failed to fetch analytics', 500);
  }

  const statusBreakdown = {};
  let totalEarnings = 0;
  let totalSpent = 0;

  rentals.forEach((rental) => {
    statusBreakdown[rental.status] = (statusBreakdown[rental.status] || 0) + 1;
    if (rental.status === RENTAL_STATUS.COMPLETED && rental.agreed_price) {
      if (rental.owner_id === userId) totalEarnings += Number(rental.agreed_price);
      if (rental.borrower_id === userId) totalSpent += Number(rental.agreed_price);
    }
  });

  return {
    totalRentals: rentals.length,
    statusBreakdown,
    totalEarnings: Number(totalEarnings.toFixed(2)),
    totalSpent: Number(totalSpent.toFixed(2)),
  };
}

module.exports = { getOverview, getTrendingCategories, getTrendingAssets, getRecentRentals, getAnalytics };
