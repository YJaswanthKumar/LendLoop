const supabase = require('../config/supabase');
const { AppError } = require('../middleware/error.middleware');
const { getPagination, buildPaginationMeta } = require('../utils/helpers');
const assetService = require('./asset.service');

async function addToWishlist(userId, assetId) {
  // Confirms the asset exists (throws 404 otherwise) before wishlisting it.
  const asset = await assetService.getAssetById(assetId);

  if (asset.owner_id === userId) {
    throw new AppError('You cannot wishlist your own listing', 400);
  }

  const { data: existing, error: lookupError } = await supabase
    .from('wishlists')
    .select('id')
    .eq('user_id', userId)
    .eq('asset_id', assetId)
    .maybeSingle();

  if (lookupError) {
    throw new AppError('Failed to check wishlist', 500);
  }
  if (existing) {
    return existing;
  }

  const { data: entry, error } = await supabase
    .from('wishlists')
    .insert({ user_id: userId, asset_id: assetId })
    .select()
    .single();

  if (error) {
    throw new AppError('Failed to add to wishlist', 500);
  }

  return entry;
}

async function removeFromWishlist(userId, assetId) {
  const { error } = await supabase
    .from('wishlists')
    .delete()
    .eq('user_id', userId)
    .eq('asset_id', assetId);

  if (error) {
    throw new AppError('Failed to remove from wishlist', 500);
  }

  return true;
}

// Returns the full asset objects the user has wishlisted, most recent first.
async function getWishlist(userId, query) {
  const { page, limit, from, to } = getPagination(query);

  const {
    data,
    error,
    count,
  } = await supabase
    .from('wishlists')
    .select('id, created_at, asset:assets(*)', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new AppError('Failed to fetch wishlist', 500);
  }

  const assets = (data || [])
    .filter((row) => row.asset) // tolerate assets deleted since being wishlisted
    .map((row) => ({ ...row.asset, wishlisted_at: row.created_at }));

  return { assets, pagination: buildPaginationMeta(page, limit, count) };
}

// Lightweight endpoint the frontend calls once after login to know which
// asset ids are already wishlisted, so heart icons render correctly
// everywhere without an extra request per card.
async function getWishlistedAssetIds(userId) {
  const { data, error } = await supabase.from('wishlists').select('asset_id').eq('user_id', userId);

  if (error) {
    throw new AppError('Failed to fetch wishlist', 500);
  }

  return (data || []).map((row) => row.asset_id);
}

module.exports = { addToWishlist, removeFromWishlist, getWishlist, getWishlistedAssetIds };
