const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

router.get('/overview', dashboardController.getOverview);
router.get('/trending-categories', dashboardController.getTrendingCategories);
router.get('/trending-assets', dashboardController.getTrendingAssets);
router.get('/recent-rentals', dashboardController.getRecentRentals);
router.get('/analytics', dashboardController.getAnalytics);

module.exports = router;
