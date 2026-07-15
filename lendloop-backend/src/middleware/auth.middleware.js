const { verifyToken } = require('../utils/helpers');
const { failure } = require('../utils/response');
const supabase = require('../config/supabase');

// Presence heartbeat: fire-and-forget, never awaited so it can't slow
// down or fail a real request. Updates last_seen on every authed call.
function touchLastSeen(userId) {
  supabase
    .from('users')
    .update({ last_seen: new Date().toISOString() })
    .eq('id', userId)
    .then(
      () => {},
      () => {}
    );
}

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return failure(res, 401, 'Authentication token missing or malformed');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = { id: decoded.id, email: decoded.email };
    touchLastSeen(decoded.id);
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return failure(res, 401, 'Authentication token has expired');
    }
    return failure(res, 401, 'Invalid authentication token');
  }
}

module.exports = { authenticate };
