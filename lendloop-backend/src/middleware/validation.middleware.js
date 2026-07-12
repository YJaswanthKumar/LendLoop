const { validationResult } = require('express-validator');
const { failure } = require('../utils/response');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => ({
      field: e.path,
      message: e.msg,
    }));
    return failure(res, 422, 'Validation failed', formatted);
  }
  return next();
}

module.exports = { validate };
