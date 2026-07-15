const express = require('express');
const reviewController = require('../controllers/review.controller');
const {
  createReviewValidator,
  userIdParamValidator,
  listReviewsValidator,
} = require('../validators/review.validator');
const { validate } = require('../middleware/validation.middleware');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/', authenticate, createReviewValidator, validate, reviewController.createReview);
router.get('/user/:userId', userIdParamValidator, listReviewsValidator, validate, reviewController.getReviewsForUser);

module.exports = router;
