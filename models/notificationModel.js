const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' },
  commentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
  userImg: { type: String },
  userName: { type: String },
  storeName: { type: String },
  actionType: { 
    type: String, 
    required: true,
    enum: ['comment', 'like', 'reply']
  },
  contentType: {
    type: String,
    enum: ['article', 'comment', 'reply']
  },
  read: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: () => new Date(+new Date() + 30*24*60*60*1000) },
  metadata: {
    articleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Article' },
    replyId: { type: mongoose.Schema.Types.ObjectId },
    originalContent: { type: String }
  }
}, {
  timestamps: true
});

notificationSchema.index({ userId: 1, read: 1, timestamp: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// 添加靜態方法
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({ userId, read: false });
};

notificationSchema.statics.markMultipleAsRead = function(userId, notificationIds) {
  return this.updateMany(
    { _id: { $in: notificationIds }, userId },
    { read: true }
  );
};

module.exports = mongoose.model("Notification", notificationSchema);