const mongoose = require("mongoose");

const notificationSettingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  preferences: {
    comments: { type: Boolean, default: true },
    likes: { type: Boolean, default: true },
    replies: { type: Boolean, default: true }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("NotificationSetting", notificationSettingSchema);