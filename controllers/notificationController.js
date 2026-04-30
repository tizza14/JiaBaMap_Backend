const Notification = require("../models/notificationModel");
const NotificationService = require("../services/notificationService");
const User = require("../models/usersModel");
const { getIO } = require("../socketConfig");

const createNotification = async ({
  receiverId,
  actionUserId,
  actionType,
  relatedId,
  relatedType,
  additionalData = {},
}) => {
  try {
    const userNameFromPayload =
      additionalData.userName ||
      additionalData.commenterName ||
      additionalData.replierName ||
      null;
    let userName = userNameFromPayload;
    let userImg = additionalData.userImg || null;

    if (!userName && actionUserId) {
      const actionUser = await User.findById(actionUserId);
      if (actionUser) {
        userName = actionUser.name;
        userImg = actionUser.profilePicture;
      }
    }

    const notification = await Notification.create({
      userId: receiverId,
      actionType,
      relatedType,
      relatedId,
      userName,
      userImg,
      metadata: {
        ...additionalData,
        originalContent: additionalData.content,
      },
    });

    const io = getIO();
    io.to(receiverId.toString()).emit("newNotification", {
      notification: {
        _id: notification._id,
        userId: notification.userId,
        actionType: notification.actionType,
        relatedType: notification.relatedType,
        relatedId: notification.relatedId,
        userName: notification.userName,
        userImg: notification.userImg,
        metadata: notification.metadata,
        read: notification.read,
        timestamp: notification.timestamp,
        createdAt: notification.createdAt,
      },
    });

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

class NotificationController {
  static async getNotifications(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const notifications = await NotificationService.getUserNotifications(
        userId,
        page,
        limit,
      );
      res.status(200).json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Error fetching notifications", error });
    }
  }

  static async getUnreadCount(req, res) {
    try {
      const { userId } = req.params;
      const count = await Notification.getUnreadCount(userId);
      res.status(200).json({ count });
    } catch (error) {
      res.status(500).json({ message: "Error fetching unread count", error });
    }
  }

  static async markAsRead(req, res) {
    try {
      const { notificationId } = req.params;
      const userId = req.user.id;

      const notification = await NotificationService.markAsRead(
        userId,
        notificationId,
      );

      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }

      res.status(200).json(notification);
    } catch (error) {
      res.status(500).json({ message: "Error marking notification as read", error });
    }
  }

  static async markMultipleAsRead(req, res) {
    try {
      const { notificationIds } = req.body;
      const { userId } = req.params;

      await Notification.markMultipleAsRead(userId, notificationIds);

      res.status(200).json({ message: "Notifications marked as read" });
    } catch (error) {
      res.status(500).json({ message: "Error marking notifications as read", error });
    }
  }

  static async markAllAsRead(req, res) {
    try {
      const { userId } = req.params;
      await NotificationService.markAllAsRead(userId);
      res.status(200).json({ message: "All notifications marked as read" });
    } catch (error) {
      res.status(500).json({ message: "Error marking all notifications as read", error });
    }
  }
}

module.exports = { NotificationController, createNotification };
