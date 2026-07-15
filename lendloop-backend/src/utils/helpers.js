const jwt = require('jsonwebtoken');
const env = require('../config/env');

function generateToken(payload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

// Removes sensitive fields before sending a user object back to the client
function sanitizeUser(user) {
  if (!user) return user;
  const { password_hash, ...safeUser } = user;
  return safeUser;
}

// Parses page/limit query params into safe integers with sane defaults
function getPagination(query) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  return { page, limit, from, to };
}

function buildPaginationMeta(page, limit, count) {
  return {
    page,
    limit,
    totalItems: count || 0,
    totalPages: count ? Math.ceil(count / limit) : 0,
  };
}

// Haversine formula - distance in kilometers between two lat/lng points
function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculates inclusive number of days between two ISO date strings
function calculateTotalDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return days > 0 ? days : 1;
}

// Whole calendar days between "now" and a future date. Never negative.
function daysUntil(dateStr, now = new Date()) {
  const target = new Date(dateStr);
  const diffMs = target.setHours(0, 0, 0, 0) - new Date(now).setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

// Applies a policy's refund ladder (ordered by minDaysBefore, descending) to
// find the refund percentage for the number of days remaining before the
// rental's start date.
function refundPercentForPolicy(rules, daysBefore) {
  const sorted = [...rules].sort((a, b) => b.minDaysBefore - a.minDaysBefore);
  const matched = sorted.find((rule) => daysBefore >= rule.minDaysBefore);
  return matched ? matched.refundPercent : 0;
}

// Computes the borrower's refund for a cancellation, following the asset's
// cancellation policy and how many days remain before the rental was due to
// start. LendLoop doesn't move real money, so this is the platform's
// recorded guidance for how the two parties should settle up, not a
// processed transaction.
function calculateCancellationRefund({ policy, startDate, price, cancelledByOwner, rules, now }) {
  const amount = Number(price) || 0;

  // If the owner cancels (backs out on a confirmed booking), the borrower is
  // always made whole regardless of policy or timing.
  if (cancelledByOwner) {
    return { refundPercent: 100, refundAmount: amount };
  }

  const policyRules = rules?.[policy];
  if (!policyRules) {
    return { refundPercent: 100, refundAmount: amount };
  }

  const daysBefore = daysUntil(startDate, now);
  const refundPercent = refundPercentForPolicy(policyRules, daysBefore);
  const refundAmount = Number(((amount * refundPercent) / 100).toFixed(2));
  return { refundPercent, refundAmount };
}

module.exports = {
  generateToken,
  verifyToken,
  sanitizeUser,
  getPagination,
  buildPaginationMeta,
  haversineDistanceKm,
  calculateTotalDays,
  daysUntil,
  calculateCancellationRefund,
};
