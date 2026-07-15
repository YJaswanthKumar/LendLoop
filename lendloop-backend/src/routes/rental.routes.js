const express = require('express');
const rentalController = require('../controllers/rental.controller');
const {
  createRentalValidator,
  counterOfferValidator,
  rentalIdValidator,
  acceptOfferValidator,
  cancelRentalValidator,
  resolveDepositValidator,
  rentalHistoryValidator,
} = require('../validators/rental.validator');
const { validate } = require('../middleware/validation.middleware');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

router.post('/', createRentalValidator, validate, rentalController.createRentalRequest);
router.get('/history', rentalHistoryValidator, validate, rentalController.getRentalHistory);
router.get('/:id', rentalIdValidator, validate, rentalController.getRentalDetails);
router.patch('/:id/counter-offer', counterOfferValidator, validate, rentalController.counterOffer);
router.patch('/:id/accept', acceptOfferValidator, validate, rentalController.acceptOffer);
router.patch('/:id/reject', rentalIdValidator, validate, rentalController.rejectOffer);
router.patch('/:id/cancel', cancelRentalValidator, validate, rentalController.cancelRental);
router.patch('/:id/deposit', resolveDepositValidator, validate, rentalController.resolveDeposit);
router.patch('/:id/start', rentalIdValidator, validate, rentalController.startRental);
router.patch('/:id/complete', rentalIdValidator, validate, rentalController.completeRental);

module.exports = router;
