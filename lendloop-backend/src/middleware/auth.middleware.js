const { verifyToken } = require('../utils/helpers');
const { failure } = require('../utils/response');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return failure(res, 401, 'Authentication token missing or malformed');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = { id: decoded.id, email: decoded.email };
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return failure(res, 401, 'Authentication token has expired');
    }
    return failure(res, 401, 'Invalid authentication token');
  }
}

module.exports = { authenticate };
