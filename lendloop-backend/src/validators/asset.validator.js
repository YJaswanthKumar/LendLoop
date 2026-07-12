const { body, param, query } = require('express-validator');
const { ASSET_AVAILABILITY } = require('../utils/constants');

const createAssetValidator = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('description').optional({ nullable: true }).isString(),
  body('brand').optional({ nullable: true }).isString(),
  body('condition').optional({ nullable: true }).isString(),
  body('purchaseYear').optional({ nullable: true }).isInt({ min: 1900, max: new Date().getFullYear() }),
  body('expectedPricePerDay').notEmpty().withMessage('Expected price per day is required').isFloat({ min: 0 }),
  body('minimumPrice').optional({ nullable: true }).isFloat({ min: 0 }),
  body('priceNegotiable').optional({ nullable: true }).isBoolean(),
  body('securityDeposit').optional({ nullable: true }).isFloat({ min: 0 }),
  body('availableFrom').optional({ nullable: true }).isISO8601().toDate(),
  body('availableTo').optional({ nullable: true }).isISO8601().toDate(),
  body('latitude').optional({ nullable: true }).isFloat(),
  body('longitude').optional({ nullable: true }).isFloat(),
  body('address').optional({ nullable: true }).isString(),
  body('city').optional({ nullable: true }).isString(),
  body('state').optional({ nullable: true }).isString(),
  body('country').optional({ nullable: true }).isString(),
  body('imageUrl').optional({ nullable: true }).isString(),
];

const updateAssetValidator = [
  param('id').isUUID().withMessage('Invalid asset id'),
  body('title').optional().trim().isLength({ max: 200 }),
  body('category').optional().trim(),
  body('description').optional({ nullable: true }).isString(),
  body('brand').optional({ nullable: true }).isString(),
  body('condition').optional({ nullable: true }).isString(),
  body('purchaseYear').optional({ nullable: true }).isInt({ min: 1900, max: new Date().getFullYear() }),
  body('expectedPricePerDay').optional().isFloat({ min: 0 }),
  body('minimumPrice').optional({ nullable: true }).isFloat({ min: 0 }),
  body('priceNegotiable').optional({ nullable: true }).isBoolean(),
  body('securityDeposit').optional({ nullable: true }).isFloat({ min: 0 }),
  body('availabilityStatus').optional().isIn(Object.values(ASSET_AVAILABILITY)),
  body('availableFrom').optional({ nullable: true }).isISO8601().toDate(),
  body('availableTo').optional({ nullable: true }).isISO8601().toDate(),
  body('latitude').optional({ nullable: true }).isFloat(),
  body('longitude').optional({ nullable: true }).isFloat(),
  body('address').optional({ nullable: true }).isString(),
  body('city').optional({ nullable: true }).isString(),
  body('state').optional({ nullable: true }).isString(),
  body('country').optional({ nullable: true }).isString(),
  body('imageUrl').optional({ nullable: true }).isString(),
];

const assetIdValidator = [param('id').isUUID().withMessage('Invalid asset id')];

const listAssetsValidator = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('category').optional().isString(),
  query('city').optional().isString(),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  query('availabilityStatus').optional().isIn(Object.values(ASSET_AVAILABILITY)),
];

const nearbyAssetsValidator = [
  query('latitude').notEmpty().withMessage('Latitude is required').isFloat(),
  query('longitude').notEmpty().withMessage('Longitude is required').isFloat(),
  query('radiusKm').optional().isFloat({ min: 0.1, max: 500 }),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

const searchAssetsValidator = [
  query('q').trim().notEmpty().withMessage('Search query "q" is required'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

module.exports = {
  createAssetValidator,
  updateAssetValidator,
  assetIdValidator,
  listAssetsValidator,
  nearbyAssetsValidator,
  searchAssetsValidator,
};
