const express = require('express');
const router = express.Router();
const { NotificationController } = require('../controllers/notificationController');
const authMiddleware = require('../controllers/middlewares/authMiddleWare');


router.use(authMiddleware);
router.get('/:userId', NotificationController.getNotifications);
router.get('/:userId/unread', NotificationController.getUnreadCount);
router.patch('/read/:notificationId', NotificationController.markAsRead);
router.patch('/:userId/read-multiple', NotificationController.markMultipleAsRead);

module.exports = router;