const express = require('express');
const wishlistController = require('../controllers/wishlist.controller');
const {
  addToWishlistValidator,
  removeFromWishlistValidator,
  listWishlistValidator,
} = require('../validators/wishlist.validator');
const { validate } = require('../middleware/validation.middleware');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

router.get('/', listWishlistValidator, validate, wishlistController.getWishlist);
router.get('/ids', wishlistController.getWishlistedAssetIds);
router.post('/', addToWishlistValidator, validate, wishlistController.addToWishlist);
router.delete('/:assetId', removeFromWishlistValidator, validate, wishlistController.removeFromWishlist);

module.exports = router;
