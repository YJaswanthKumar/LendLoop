const express = require('express');
const adminController = require('../controllers/admin.controller');
const {
  listUsersValidator,
  userIdParamValidator,
  setUserStatusValidator,
  listAssetsValidator,
  assetIdParamValidator,
  setAssetHiddenValidator,
  listRentalsValidator,
  listReviewsValidator,
  reviewIdParamValidator,
  listActivityValidator,
} = require('../validators/admin.validator');
const { validate } = require('../middleware/validation.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get('/overview', adminController.getOverview);
router.get('/analytics', adminController.getAnalytics);
router.get('/activity', listActivityValidator, validate, adminController.getActivity);

router.get('/users', listUsersValidator, validate, adminController.getUsers);
router.get('/users/:userId', userIdParamValidator, validate, adminController.getUserDetail);
router.patch('/users/:userId/status', setUserStatusValidator, validate, adminController.setUserStatus);

router.get('/assets', listAssetsValidator, validate, adminController.getAssets);
router.patch('/assets/:assetId/hidden', setAssetHiddenValidator, validate, adminController.setAssetHidden);
router.delete('/assets/:assetId', assetIdParamValidator, validate, adminController.removeAsset);

router.get('/rentals', listRentalsValidator, validate, adminController.getRentals);

router.get('/reviews', listReviewsValidator, validate, adminController.getReviews);
router.delete('/reviews/:reviewId', reviewIdParamValidator, validate, adminController.deleteReview);

module.exports = router;
