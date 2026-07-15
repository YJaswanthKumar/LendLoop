const { query, param, body } = require('express-validator');

const paginationValidator = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

const listUsersValidator = [
  ...paginationValidator,
  query('search').optional().isString(),
  query('isActive').optional().isIn(['true', 'false']),
  query('isAdmin').optional().isIn(['true', 'false']),
  query('sortBy').optional().isString(),
  query('sortDir').optional().isIn(['asc', 'desc']),
];

const userIdParamValidator = [param('userId').isUUID().withMessage('Invalid user id')];

const setUserStatusValidator = [
  param('userId').isUUID().withMessage('Invalid user id'),
  body('isActive').isBoolean().withMessage('isActive must be a boolean'),
];

const listAssetsValidator = [
  ...paginationValidator,
  query('search').optional().isString(),
  query('category').optional().isString(),
  query('availabilityStatus').optional().isString(),
  query('ownerId').optional().isUUID(),
  query('sortBy').optional().isString(),
  query('sortDir').optional().isIn(['asc', 'desc']),
];

const assetIdParamValidator = [param('assetId').isUUID().withMessage('Invalid asset id')];

const setAssetHiddenValidator = [
  param('assetId').isUUID().withMessage('Invalid asset id'),
  body('hidden').isBoolean().withMessage('hidden must be a boolean'),
];

const listRentalsValidator = [...paginationValidator, query('status').optional().isString(), query('search').optional().isString()];

const listReviewsValidator = [
  ...paginationValidator,
  query('minRating').optional().isFloat({ min: 1, max: 5 }),
  query('maxRating').optional().isFloat({ min: 1, max: 5 }),
];

const reviewIdParamValidator = [param('reviewId').isUUID().withMessage('Invalid review id')];

const listActivityValidator = [...paginationValidator, query('type').optional().isString()];

module.exports = {
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
};
