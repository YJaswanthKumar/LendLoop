const express = require('express');
const assetController = require('../controllers/asset.controller');
const {
  createAssetValidator,
  updateAssetValidator,
  assetIdValidator,
  listAssetsValidator,
  nearbyAssetsValidator,
  searchAssetsValidator,
} = require('../validators/asset.validator');
const { validate } = require('../middleware/validation.middleware');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// Specific routes must be declared before the dynamic /:id route
router.get('/nearby', nearbyAssetsValidator, validate, assetController.getNearbyAssets);
router.get('/search', searchAssetsValidator, validate, assetController.searchAssets);

router.post('/', authenticate, createAssetValidator, validate, assetController.createAsset);
router.get('/', listAssetsValidator, validate, assetController.getAssets);
router.get('/:id', assetIdValidator, validate, assetController.getAssetById);
router.put('/:id', authenticate, updateAssetValidator, validate, assetController.updateAsset);
router.delete('/:id', authenticate, assetIdValidator, validate, assetController.deleteAsset);

module.exports = router;
