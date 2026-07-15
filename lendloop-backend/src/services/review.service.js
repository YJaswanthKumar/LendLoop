const supabase = require('../config/supabase');
const { AppError } = require('../middleware/error.middleware');
const { getPagination, buildPaginationMeta } = require('../utils/helpers');
const { RENTAL_STATUS } = require('../utils/constants');
const rentalService = require('./rental.service');

async function recalculateAverageRating(userId) {
  const { data: reviews, error } = await supabase.from('reviews').select('rating').eq('receiver_id', userId);

  if (error || !reviews || reviews.length === 0) return;

  const avg = reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length;

  await supabase
    .from('users')
    .update({ average_rating: Number(avg.toFixed(2)), updated_at: new Date().toISOString() })
    .eq('id', userId);
}

async function createReview(reviewerId, payload) {
  const { rentalId, receiverId, rating, review } = payload;

  const rental = await rentalService.getRentalById(rentalId);

  if (rental.status !== RENTAL_STATUS.COMPLETED) {
    throw new AppError('Reviews can only be submitted for completed rentals', 400);
  }
  if (rental.owner_id !== reviewerId && rental.borrower_id !== reviewerId) {
    throw new AppError('You are not authorized to review this rental', 403);
  }
  if (receiverId !== rental.owner_id && receiverId !== rental.borrower_id) {
    throw new AppError('receiverId must be a participant of this rental', 400);
  }
  if (receiverId === reviewerId) {
    throw new AppError('You cannot review yourself', 400);
  }

  const { data: existingReview, error: existingError } = await supabase
    .from('reviews')
    .select('id')
    .eq('rental_id', rentalId)
    .eq('reviewer_id', reviewerId)
    .maybeSingle();

  if (existingError) {
    throw new AppError('Failed to verify existing review', 500);
  }
  if (existingReview) {
    throw new AppError('You have already reviewed this rental', 409);
  }

  const { data: newReview, error } = await supabase
    .from('reviews')
    .insert({
      rental_id: rentalId,
      reviewer_id: reviewerId,
      receiver_id: receiverId,
      rating,
      review: review || null,
    })
    .select()
    .single();

  if (error) {
    throw new AppError('Failed to create review', 500);
  }

  await recalculateAverageRating(receiverId);

  return newReview;
}

async function getReviewsForUser(userId, query) {
  const { page, limit, from, to } = getPagination(query);

  const { data, error, count } = await supabase
    .from('reviews')
    .select('*', { count: 'exact' })
    .eq('receiver_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new AppError('Failed to fetch reviews', 500);
  }

  const { data: userRow, error: userError } = await supabase
    .from('users')
    .select('average_rating')
    .eq('id', userId)
    .maybeSingle();

  if (userError) {
    throw new AppError('Failed to fetch user rating', 500);
  }

  return {
    reviews: data,
    averageRating: userRow?.average_rating ?? 0,
    pagination: buildPaginationMeta(page, limit, count),
  };
}

module.exports = { createReview, getReviewsForUser };
