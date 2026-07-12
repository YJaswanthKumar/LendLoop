const dashboardService = require('../services/dashboard.service');
const { success } = require('../utils/response');

async function getOverview(req, res, next) {
  try {
    const overview = await dashboardService.getOverview(req.user.id);
    return success(res, 200, 'Dashboard overview fetched successfully', { overview });
  } catch (err) {
    return next(err);
  }
}

async function getTrendingCategories(req, res, next) {
  try {
    const categories = await dashboardService.getTrendingCategories();
    return success(res, 200, 'Trending categories fetched successfully', { categories });
  } catch (err) {
    return next(err);
  }
}

async function getTrendingAssets(req, res, next) {
  try {
    const assets = await dashboardService.getTrendingAssets();
    return success(res, 200, 'Trending assets fetched successfully', { assets });
  } catch (err) {
    return next(err);
  }
}

async function getRecentRentals(req, res, next) {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
    const rentals = await dashboardService.getRecentRentals(req.user.id, limit);
    return success(res, 200, 'Recent rentals fetched successfully', { rentals });
  } catch (err) {
    return next(err);
  }
}

async function getAnalytics(req, res, next) {
  try {
    const analytics = await dashboardService.getAnalytics(req.user.id);
    return success(res, 200, 'Analytics fetched successfully', { analytics });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getOverview, getTrendingCategories, getTrendingAssets, getRecentRentals, getAnalytics };
