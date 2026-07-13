const rentalService = require('../services/rental.service');
const { success } = require('../utils/response');

async function createRentalRequest(req, res, next) {
  try {
    const rental = await rentalService.createRentalRequest(req.user.id, req.body);
    return success(res, 201, 'Rental request created successfully', { rental });
  } catch (err) {
    return next(err);
  }
}

async function counterOffer(req, res, next) {
  try {
    const rental = await rentalService.counterOffer(req.params.id, req.user.id, req.body);
    return success(res, 200, 'Counter offer submitted successfully', { rental });
  } catch (err) {
    return next(err);
  }
}

async function acceptOffer(req, res, next) {
  try {
    const rental = await rentalService.acceptOffer(req.params.id, req.user.id, req.body);
    return success(res, 200, 'Rental offer accepted successfully', { rental });
  } catch (err) {
    return next(err);
  }
}

async function rejectOffer(req, res, next) {
  try {
    const rental = await rentalService.rejectOffer(req.params.id, req.user.id);
    return success(res, 200, 'Rental offer rejected successfully', { rental });
  } catch (err) {
    return next(err);
  }
}

async function cancelRental(req, res, next) {
  try {
    const rental = await rentalService.cancelRental(req.params.id, req.user.id);
    return success(res, 200, 'Rental cancelled successfully', { rental });
  } catch (err) {
    return next(err);
  }
}

async function startRental(req, res, next) {
  try {
    const rental = await rentalService.startRental(req.params.id, req.user.id);
    return success(res, 200, 'Rental started successfully', { rental });
  } catch (err) {
    return next(err);
  }
}

async function completeRental(req, res, next) {
  try {
    const rental = await rentalService.completeRental(req.params.id, req.user.id);
    return success(res, 200, 'Rental completed successfully', { rental });
  } catch (err) {
    return next(err);
  }
}

async function getRentalHistory(req, res, next) {
  try {
    const result = await rentalService.getRentalHistory(req.user.id, req.query);
    return success(res, 200, 'Rental history fetched successfully', result);
  } catch (err) {
    return next(err);
  }
}

async function getRentalDetails(req, res, next) {
  try {
    const rental = await rentalService.getRentalDetails(req.params.id, req.user.id);
    return success(res, 200, 'Rental fetched successfully', { rental });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createRentalRequest,
  counterOffer,
  acceptOffer,
  rejectOffer,
  cancelRental,
  startRental,
  completeRental,
  getRentalHistory,
  getRentalDetails,
};
