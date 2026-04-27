const Notification = require('../models/notificationModel');
const NotificationSetting = require('../models/notificationSettingModel');
const { getIO } = require('../socketConfig');
const schedule = require('node-schedule');

class NotificationService {
  static async createNotification(notificationData) {
    const notification = await Notification.create(notificationData);
    const io = getIO();
    io.to(notification.userId.toString()).emit("newNotification", {
      notification,
      message: this.getNotificationMessage(notification)
    });
    return notification;
  }

  static getNotificationMessage(notification) {
    const actionMessages = {
      comment: '評論了你的貼文',
      like: '對你的貼文按讚',
      reply: '回覆了你的評論'
    };
    return actionMessages[notification.actionType] || '與你互動';
  }

  static async getUserNotifications(userId, page = 1, limit = 20) {
    return await Notification.find({ userId })
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
  }

  static async markAsRead(userId, notificationId) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { read: true },
      { new: true }
    );
    
    if (notification) {
      const io = getIO();
      io.to(userId.toString()).emit("readNotification", { notificationId });
    }
    
    return notification;
  }

  static async cleanupOldNotifications() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return await Notification.deleteMany({
      $or: [
        { timestamp: { $lt: thirtyDaysAgo } },
        { expiresAt: { $lt: new Date() } }
      ]
    });
  }
}

// 設定每日清理任務
schedule.scheduleJob('0 0 * * *', async () => {
  try {
    await NotificationService.cleanupOldNotifications();
    console.log('Cleaned up old notifications');
  } catch (error) {
    console.error('Error cleaning up notifications:', error);
  }
});

module.exports = NotificationService;
