const express = require('express');
const rentalController = require('../controllers/rental.controller');
const {
  createRentalValidator,
  counterOfferValidator,
  rentalIdValidator,
  acceptOfferValidator,
  rentalHistoryValidator,
} = require('../validators/rental.validator');
const { validate } = require('../middleware/validation.middleware');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

router.post('/', createRentalValidator, validate, rentalController.createRentalRequest);
router.get('/history', rentalHistoryValidator, validate, rentalController.getRentalHistory);
router.patch('/:id/counter-offer', counterOfferValidator, validate, rentalController.counterOffer);
router.patch('/:id/accept', acceptOfferValidator, validate, rentalController.acceptOffer);
router.patch('/:id/reject', rentalIdValidator, validate, rentalController.rejectOffer);
router.patch('/:id/cancel', rentalIdValidator, validate, rentalController.cancelRental);
router.patch('/:id/complete', rentalIdValidator, validate, rentalController.completeRental);

module.exports = router;
