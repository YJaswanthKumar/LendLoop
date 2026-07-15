const { body, param, query } = require('express-validator');

const addToWishlistValidator = [body('assetId').isUUID().withMessage('Valid assetId is required')];

const removeFromWishlistValidator = [param('assetId').isUUID().withMessage('Invalid assetId')];

const listWishlistValidator = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

module.exports = { addToWishlistValidator, removeFromWishlistValidator, listWishlistValidator };
