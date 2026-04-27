const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    maxLength: 200
  },
  userId: {
    type: String,
    required: true
  },
  user: {
    type: String,
    required: true
  },
  userPhoto: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  likedBy: [{
    type: String
  }],
  likesCount: {
    type: Number,
    default: 0
  }
});

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    maxLength: 200
  },
  userId: {
    type: String,
    required: true
  },
  user: {
    type: String,
    required: true
  },
  userPhoto: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  likedBy: [{
    type: String
  }],
  likesCount: {
    type: Number,
    default: 0
  },
  replies: [replySchema]
});

const articleSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  user: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },
  userPhoto: String,
  placeId: String,
  restaurantName: String,
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  photo: {
    type: [String],
    default: [],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  eatdateAt: {
    type: Date,
    required: function() {
      // 只在創建新文章時要求 eatdateAt
      return this.isNew;
    }
  },
  likedBy: [{
    type: String
  }],
  likesCount: {
    type: Number,
    default: 0
  },
  comments: [commentSchema]
});

// 索引
articleSchema.index({ userId: 1, placeId: 1 });
articleSchema.index({ createdAt: -1 });

// 添加方法來檢查用戶是否已按讚
articleSchema.methods.isLikedBy = function(userId) {
  return this.likedBy.includes(userId);
};

commentSchema.methods.isLikedBy = function(userId) {
  return this.likedBy.includes(userId);
};

replySchema.methods.isLikedBy = function(userId) {
  return this.likedBy.includes(userId);
};

module.exports = mongoose.model('Article', articleSchema);
