const express = require('express');
const notificationController = require('../controllers/notification.controller');
const {
  createNotificationValidator,
  notificationIdValidator,
  listNotificationsValidator,
} = require('../validators/notification.validator');
const { validate } = require('../middleware/validation.middleware');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

router.post('/', createNotificationValidator, validate, notificationController.createNotification);
router.get('/', listNotificationsValidator, validate, notificationController.getNotifications);
router.patch('/:id/read', notificationIdValidator, validate, notificationController.markAsRead);

module.exports = router;
