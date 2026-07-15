const { failure } = require('../utils/response');

// Custom error class services/controllers can throw for known, expected failures
class AppError extends Error {
  constructor(message, statusCode = 400, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

function notFoundHandler(req, res) {
  return failure(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // eslint-disable-next-line no-console
  console.error(err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  const errors = err.errors || [];

  return failure(res, statusCode, message, errors);
}

module.exports = { AppError, notFoundHandler, errorHandler };
