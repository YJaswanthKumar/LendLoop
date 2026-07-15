const wishlistService = require('../services/wishlist.service');
const { success } = require('../utils/response');

async function addToWishlist(req, res, next) {
  try {
    const entry = await wishlistService.addToWishlist(req.user.id, req.body.assetId);
    return success(res, 201, 'Added to wishlist', { wishlist: entry });
  } catch (err) {
    return next(err);
  }
}

async function removeFromWishlist(req, res, next) {
  try {
    await wishlistService.removeFromWishlist(req.user.id, req.params.assetId);
    return success(res, 200, 'Removed from wishlist', {});
  } catch (err) {
    return next(err);
  }
}

async function getWishlist(req, res, next) {
  try {
    const result = await wishlistService.getWishlist(req.user.id, req.query);
    return success(res, 200, 'Wishlist fetched successfully', result);
  } catch (err) {
    return next(err);
  }
}

async function getWishlistedAssetIds(req, res, next) {
  try {
    const assetIds = await wishlistService.getWishlistedAssetIds(req.user.id);
    return success(res, 200, 'Wishlisted asset ids fetched successfully', { assetIds });
  } catch (err) {
    return next(err);
  }
}

module.exports = { addToWishlist, removeFromWishlist, getWishlist, getWishlistedAssetIds };
