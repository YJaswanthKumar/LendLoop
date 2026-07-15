const supabase = require('../config/supabase');
const { AppError } = require('../middleware/error.middleware');
const { getPagination, buildPaginationMeta, haversineDistanceKm } = require('../utils/helpers');
const { ASSET_AVAILABILITY } = require('../utils/constants');

async function createAsset(ownerId, payload) {
  const {
    title,
    category,
    description,
    brand,
    condition,
    purchaseYear,
    expectedPricePerDay,
    minimumPrice,
    priceNegotiable,
    securityDeposit,
    availableFrom,
    availableTo,
    latitude,
    longitude,
    address,
    city,
    state,
    country,
    imageUrl,
    cancellationPolicy,
  } = payload;

  const { data: asset, error } = await supabase
    .from('assets')
    .insert({
      owner_id: ownerId,
      title,
      category,
      description: description || null,
      brand: brand || null,
      condition: condition || null,
      purchase_year: purchaseYear ?? null,
      expected_price_per_day: expectedPricePerDay,
      minimum_price: minimumPrice ?? null,
      price_negotiable: priceNegotiable ?? true,
      security_deposit: securityDeposit ?? 0,
      cancellation_policy: cancellationPolicy || 'MODERATE',
      availability_status: ASSET_AVAILABILITY.AVAILABLE,
      available_from: availableFrom || null,
      available_to: availableTo || null,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      address: address || null,
      city: city || null,
      state: state || null,
      country: country || null,
      image_url: imageUrl || null,
    })
    .select()
    .single();

  if (error) {
    throw new AppError('Failed to create asset', 500);
  }

  // Keep the owner's total_assets counter in sync
  await incrementUserAssetCount(ownerId, 1);

  return asset;
}

async function incrementUserAssetCount(userId, delta) {
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('total_assets')
    .eq('id', userId)
    .maybeSingle();

  if (fetchError || !user) return;

  const newCount = Math.max((user.total_assets || 0) + delta, 0);

  await supabase.from('users').update({ total_assets: newCount, updated_at: new Date().toISOString() }).eq('id', userId);
}

async function getAssets(query) {
  const { page, limit, from, to } = getPagination(query);
  const { category, city, minPrice, maxPrice, availabilityStatus } = query;

  let builder = supabase.from('assets').select('*', { count: 'exact' }).eq('is_active', true);

  if (category) builder = builder.eq('category', category);
  if (city) builder = builder.ilike('city', `%${city}%`);
  if (availabilityStatus) builder = builder.eq('availability_status', availabilityStatus);
  if (minPrice) builder = builder.gte('expected_price_per_day', minPrice);
  if (maxPrice) builder = builder.lte('expected_price_per_day', maxPrice);

  const { data, error, count } = await builder.order('created_at', { ascending: false }).range(from, to);

  if (error) {
    throw new AppError('Failed to fetch assets', 500);
  }

  return { assets: data, pagination: buildPaginationMeta(page, limit, count) };
}

async function getAssetById(id) {
  const { data: asset, error } = await supabase.from('assets').select('*').eq('id', id).maybeSingle();

  if (error) {
    throw new AppError('Failed to fetch asset', 500);
  }
  if (!asset) {
    throw new AppError('Asset not found', 404);
  }

  return asset;
}

async function updateAsset(id, ownerId, payload) {
  const existing = await getAssetById(id);

  if (existing.owner_id !== ownerId) {
    throw new AppError('You are not authorized to update this asset', 403);
  }

  const fieldMap = {
    title: 'title',
    category: 'category',
    description: 'description',
    brand: 'brand',
    condition: 'condition',
    purchaseYear: 'purchase_year',
    expectedPricePerDay: 'expected_price_per_day',
    minimumPrice: 'minimum_price',
    priceNegotiable: 'price_negotiable',
    securityDeposit: 'security_deposit',
    cancellationPolicy: 'cancellation_policy',
    availabilityStatus: 'availability_status',
    availableFrom: 'available_from',
    availableTo: 'available_to',
    latitude: 'latitude',
    longitude: 'longitude',
    address: 'address',
    city: 'city',
    state: 'state',
    country: 'country',
    imageUrl: 'image_url',
  };

  const updatePayload = { updated_at: new Date().toISOString() };
  Object.entries(fieldMap).forEach(([camel, snake]) => {
    if (payload[camel] !== undefined) {
      updatePayload[snake] = payload[camel];
    }
  });

  const { data: updated, error } = await supabase
    .from('assets')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new AppError('Failed to update asset', 500);
  }

  return updated;
}

async function deleteAsset(id, ownerId) {
  const existing = await getAssetById(id);

  if (existing.owner_id !== ownerId) {
    throw new AppError('You are not authorized to delete this asset', 403);
  }

  const { error } = await supabase
    .from('assets')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    throw new AppError('Failed to delete asset', 500);
  }

  await incrementUserAssetCount(ownerId, -1);

  return true;
}

async function getNearbyAssets(query) {
  const { page, limit } = getPagination(query);
  const latitude = parseFloat(query.latitude);
  const longitude = parseFloat(query.longitude);
  const radiusKm = query.radiusKm ? parseFloat(query.radiusKm) : 25;

  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('is_active', true)
    .eq('availability_status', ASSET_AVAILABILITY.AVAILABLE)
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);

  if (error) {
    throw new AppError('Failed to fetch nearby assets', 500);
  }

  const withDistance = data
    .map((asset) => ({
      ...asset,
      distance_km: Number(
        haversineDistanceKm(latitude, longitude, asset.latitude, asset.longitude).toFixed(2)
      ),
    }))
    .filter((asset) => asset.distance_km <= radiusKm)
    .sort((a, b) => a.distance_km - b.distance_km);

  const count = withDistance.length;
  const start = (page - 1) * limit;
  const paginated = withDistance.slice(start, start + limit);

  return { assets: paginated, pagination: buildPaginationMeta(page, limit, count) };
}

async function searchAssets(query) {
  const { page, limit, from, to } = getPagination(query);
  const q = query.q;

  const { data, error, count } = await supabase
    .from('assets')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .or(`title.ilike.%${q}%,description.ilike.%${q}%,category.ilike.%${q}%,brand.ilike.%${q}%`)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new AppError('Failed to search assets', 500);
  }

  return { assets: data, pagination: buildPaginationMeta(page, limit, count) };
}

module.exports = {
  createAsset,
  getAssets,
  getAssetById,
  updateAsset,
  deleteAsset,
  getNearbyAssets,
  searchAssets,
  incrementUserAssetCount,
};
