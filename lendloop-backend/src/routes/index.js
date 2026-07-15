const express = require('express');

const authRoutes = require('./auth.routes');
const assetRoutes = require('./asset.routes');
const rentalRoutes = require('./rental.routes');
const reviewRoutes = require('./review.routes');
const notificationRoutes = require('./notification.routes');
const dashboardRoutes = require('./dashboard.routes');
const wishlistRoutes = require('./wishlist.routes');
const adminRoutes = require('./admin.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/assets', assetRoutes);
router.use('/rentals', rentalRoutes);
router.use('/reviews', reviewRoutes);
router.use('/notifications', notificationRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/admin', adminRoutes);

module.exports = router;