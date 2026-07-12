const notificationService = require('../services/notification.service');
const { success } = require('../utils/response');

async function createNotification(req, res, next) {
  try {
    const { userId, title, message, type } = req.body;
    const notification = await notificationService.createNotification({ userId, title, message, type });
    return success(res, 201, 'Notification created successfully', { notification });
  } catch (err) {
    return next(err);
  }
}

async function getNotifications(req, res, next) {
  try {
    const result = await notificationService.getNotifications(req.user.id, req.query);
    return success(res, 200, 'Notifications fetched successfully', result);
  } catch (err) {
    return next(err);
  }
}

async function markAsRead(req, res, next) {
  try {
    const notification = await notificationService.markAsRead(req.params.id, req.user.id);
    return success(res, 200, 'Notification marked as read', { notification });
  } catch (err) {
    return next(err);
  }
}

module.exports = { createNotification, getNotifications, markAsRead };
