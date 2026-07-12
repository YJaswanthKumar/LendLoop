const { body, param, query } = require('express-validator');

const createReviewValidator = [
  body('rentalId').isUUID().withMessage('Valid rentalId is required'),
  body('receiverId').isUUID().withMessage('Valid receiverId is required'),
  body('rating').notEmpty().withMessage('Rating is required').isFloat({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('review').optional({ nullable: true }).isString().isLength({ max: 2000 }),
];

const userIdParamValidator = [param('userId').isUUID().withMessage('Invalid user id')];

const listReviewsValidator = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

module.exports = { createReviewValidator, userIdParamValidator, listReviewsValidator };
