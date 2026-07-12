const supabase = require('../config/supabase');
const { AppError } = require('../middleware/error.middleware');
const { getPagination, buildPaginationMeta } = require('../utils/helpers');
const { NOTIFICATION_TYPE } = require('../utils/constants');

async function createNotification({ userId, title, message, type }) {
  const notificationType = type && Object.values(NOTIFICATION_TYPE).includes(type) ? type : NOTIFICATION_TYPE.GENERAL;

  const { data: notification, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title,
      message,
      type: notificationType,
      is_read: false,
    })
    .select()
    .single();

  if (error) {
    throw new AppError('Failed to create notification', 500);
  }

  return notification;
}

async function getNotifications(userId, query) {
  const { page, limit, from, to } = getPagination(query);

  let builder = supabase.from('notifications').select('*', { count: 'exact' }).eq('user_id', userId);

  if (query.isRead !== undefined) {
    builder = builder.eq('is_read', query.isRead === 'true');
  }

  const { data, error, count } = await builder.order('created_at', { ascending: false }).range(from, to);

  if (error) {
    throw new AppError('Failed to fetch notifications', 500);
  }

  return { notifications: data, pagination: buildPaginationMeta(page, limit, count) };
}

async function markAsRead(id, userId) {
  const { data: notification, error: fetchError } = await supabase
    .from('notifications')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) {
    throw new AppError('Failed to fetch notification', 500);
  }
  if (!notification) {
    throw new AppError('Notification not found', 404);
  }
  if (notification.user_id !== userId) {
    throw new AppError('You are not authorized to update this notification', 403);
  }

  const { data: updated, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new AppError('Failed to mark notification as read', 500);
  }

  return updated;
}

module.exports = { createNotification, getNotifications, markAsRead };
