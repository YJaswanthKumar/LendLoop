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

module.exports = {
  generateToken,
  verifyToken,
  sanitizeUser,
  getPagination,
  buildPaginationMeta,
  haversineDistanceKm,
  calculateTotalDays,
};
