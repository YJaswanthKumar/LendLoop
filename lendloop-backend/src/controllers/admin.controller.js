const adminService = require('../services/admin.service');
const activityService = require('../services/activity.service');
const { success } = require('../utils/response');

async function getOverview(req, res, next) {
  try {
    const overview = await adminService.getOverview();
    return success(res, 200, 'Admin overview fetched successfully', { overview });
  } catch (err) {
    return next(err);
  }
}

async function getUsers(req, res, next) {
  try {
    const result = await adminService.getUsers(req.query);
    return success(res, 200, 'Users fetched successfully', result);
  } catch (err) {
    return next(err);
  }
}

async function getUserDetail(req, res, next) {
  try {
    const result = await adminService.getUserDetail(req.params.userId);
    return success(res, 200, 'User detail fetched successfully', result);
  } catch (err) {
    return next(err);
  }
}

async function setUserStatus(req, res, next) {
  try {
    const user = await adminService.setUserActiveStatus(req.params.userId, req.body.isActive);
    return success(res, 200, 'User status updated successfully', { user });
  } catch (err) {
    return next(err);
  }
}

async function getAssets(req, res, next) {
  try {
    const result = await adminService.getAssetsAdmin(req.query);
    return success(res, 200, 'Assets fetched successfully', result);
  } catch (err) {
    return next(err);
  }
}

async function setAssetHidden(req, res, next) {
  try {
    const asset = await adminService.setAssetHidden(req.params.assetId, req.body.hidden);
    return success(res, 200, `Asset ${req.body.hidden ? 'hidden' : 'unhidden'} successfully`, { asset });
  } catch (err) {
    return next(err);
  }
}

async function removeAsset(req, res, next) {
  try {
    const asset = await adminService.removeAssetAdmin(req.params.assetId);
    return success(res, 200, 'Asset removed successfully', { asset });
  } catch (err) {
    return next(err);
  }
}

async function getRentals(req, res, next) {
  try {
    const result = await adminService.getRentalsAdmin(req.query);
    return success(res, 200, 'Rentals fetched successfully', result);
  } catch (err) {
    return next(err);
  }
}

async function getReviews(req, res, next) {
  try {
    const result = await adminService.getReviewsAdmin(req.query);
    return success(res, 200, 'Reviews fetched successfully', result);
  } catch (err) {
    return next(err);
  }
}

async function deleteReview(req, res, next) {
  try {
    await adminService.deleteReviewAdmin(req.params.reviewId);
    return success(res, 200, 'Review deleted successfully', {});
  } catch (err) {
    return next(err);
  }
}

async function getActivity(req, res, next) {
  try {
    const result = await activityService.getActivityFeed(req.query);
    return success(res, 200, 'Activity feed fetched successfully', result);
  } catch (err) {
    return next(err);
  }
}

async function getAnalytics(req, res, next) {
  try {
    const analytics = await adminService.getAnalytics();
    return success(res, 200, 'Analytics fetched successfully', { analytics });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getOverview,
  getUsers,
  getUserDetail,
  setUserStatus,
  getAssets,
  setAssetHidden,
  removeAsset,
  getRentals,
  getReviews,
  deleteReview,
  getActivity,
  getAnalytics,
};
