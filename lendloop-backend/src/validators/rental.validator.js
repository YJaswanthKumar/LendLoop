const { body, param, query } = require('express-validator');
const { RENTAL_STATUS } = require('../utils/constants');

const createRentalValidator = [
  body('assetId').isUUID().withMessage('Valid assetId is required'),
  body('startDate').notEmpty().withMessage('startDate is required').isISO8601().withMessage('startDate must be a valid date'),
  body('endDate').notEmpty().withMessage('endDate is required').isISO8601().withMessage('endDate must be a valid date'),
  body('offeredPrice').notEmpty().withMessage('offeredPrice is required').isFloat({ min: 0 }),
  body('borrowerMessage').optional({ nullable: true }).isString(),
];

const counterOfferValidator = [
  param('id').isUUID().withMessage('Invalid rental id'),
  body('counterOfferPrice').notEmpty().withMessage('counterOfferPrice is required').isFloat({ min: 0 }),
  body('ownerMessage').optional({ nullable: true }).isString(),
];

const rentalIdValidator = [param('id').isUUID().withMessage('Invalid rental id')];

const acceptOfferValidator = [
  param('id').isUUID().withMessage('Invalid rental id'),
  body('agreedPrice').optional({ nullable: true }).isFloat({ min: 0 }),
];

const rentalHistoryValidator = [
  query('role').optional().isIn(['owner', 'borrower']),
  query('status').optional().isIn(Object.values(RENTAL_STATUS)),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

module.exports = {
  createRentalValidator,
  counterOfferValidator,
  rentalIdValidator,
  acceptOfferValidator,
  rentalHistoryValidator,
};
