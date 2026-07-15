const supabase = require('../config/supabase');
const { failure } = require('../utils/response');

/**
 * Must run AFTER `authenticate`. Confirms the current user has is_admin = true.
 */
async function requireAdmin(req, res, next) {
  try {
    if (!req.user?.id) {
      return failure(res, 401, 'Authentication required');
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, is_admin, is_active')
      .eq('id', req.user.id)
      .maybeSingle();

    if (error) {
      if (error.code === '42703') {
        return failure(
          res,
          503,
          'Admin features are not set up yet — run sql/002_admin_features.sql against your database, then restart the server.'
        );
      }
      return failure(res, 401, 'Unable to verify admin access');
    }
    if (!user) {
      return failure(res, 401, 'Unable to verify admin access');
    }
    if (!user.is_active) {
      return failure(res, 403, 'This account has been deactivated');
    }
    if (!user.is_admin) {
      return failure(res, 403, 'Admin access required');
    }

    return next();
  } catch (err) {
    return failure(res, 500, 'Failed to verify admin access');
  }
}

module.exports = { requireAdmin };
