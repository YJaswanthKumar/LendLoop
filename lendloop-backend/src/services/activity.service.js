const supabase = require('../config/supabase');
const { getPagination, buildPaginationMeta } = require('../utils/helpers');

const ACTIVITY_TYPE = {
  USER_REGISTERED: 'USER_REGISTERED',
  USER_LOGIN: 'USER_LOGIN',
  ASSET_LISTED: 'ASSET_LISTED',
  ASSET_UPDATED: 'ASSET_UPDATED',
  ASSET_DELETED: 'ASSET_DELETED',
  RENTAL_REQUESTED: 'RENTAL_REQUESTED',
  RENTAL_APPROVED: 'RENTAL_APPROVED',
  RENTAL_COMPLETED: 'RENTAL_COMPLETED',
  REVIEW_SUBMITTED: 'REVIEW_SUBMITTED',
  NOTIFICATION_SENT: 'NOTIFICATION_SENT',
};

/**
 * Records a platform activity event for the admin activity feed.
 * Intentionally swallows errors — activity logging must never break
 * the primary business operation it's attached to.
 */
async function logActivity({ type, message, userId = null, meta = null }) {
  try {
    await supabase.from('activity_logs').insert({
      type,
      message,
      user_id: userId,
      meta,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to log activity (non-fatal):', err.message);
  }
}

async function getActivityFeed(query) {
  const { page, limit, from, to } = getPagination(query);

  let builder = supabase.from('activity_logs').select('*', { count: 'exact' });

  if (query.type) builder = builder.eq('type', query.type);

  const { data, error, count } = await builder.order('created_at', { ascending: false }).range(from, to);

  if (error) {
    return { activities: [], pagination: buildPaginationMeta(page, limit, 0) };
  }

  return { activities: data, pagination: buildPaginationMeta(page, limit, count) };
}

module.exports = { ACTIVITY_TYPE, logActivity, getActivityFeed };
