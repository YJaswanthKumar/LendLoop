const { body, param, query } = require('express-validator');
const { NOTIFICATION_TYPE } = require('../utils/constants');

const createNotificationValidator = [
  body('userId').isUUID().withMessage('Valid userId is required'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('message').trim().notEmpty().withMessage('Message is required'),
  body('type').optional().isIn(Object.values(NOTIFICATION_TYPE)),
];

const notificationIdValidator = [param('id').isUUID().withMessage('Invalid notification id')];

const listNotificationsValidator = [
  query('isRead').optional().isIn(['true', 'false']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

module.exports = { createNotificationValidator, notificationIdValidator, listNotificationsValidator };
