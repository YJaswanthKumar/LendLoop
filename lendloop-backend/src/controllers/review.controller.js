const reviewService = require('../services/review.service');
const { success } = require('../utils/response');

async function createReview(req, res, next) {
  try {
    const review = await reviewService.createReview(req.user.id, req.body);
    return success(res, 201, 'Review submitted successfully', { review });
  } catch (err) {
    return next(err);
  }
}

async function getReviewsForUser(req, res, next) {
  try {
    const result = await reviewService.getReviewsForUser(req.params.userId, req.query);
    return success(res, 200, 'Reviews fetched successfully', result);
  } catch (err) {
    return next(err);
  }
}

module.exports = { createReview, getReviewsForUser };
