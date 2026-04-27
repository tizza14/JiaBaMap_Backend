const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  // 使用者id
  userId: {
    type: String,
    required: true,
  },
  // 餐廳的Google place id
  placeId: {
    type: String,
    required: true,
  },
  //評論內容
  content: {
    type: String,
    required: true,
  },
  //評分
  rating: {
    type: Number,
    required: true,
  },
  //平均消費金額
  AvgPrice: {
    type: Number,
  },
  //建立時間
  createdAt: {
    type: Date,
    default: Date.now,
  },
  //更新時間
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  //用餐方式限定內用(here)或外帶(toGo)
  style: {
    type: String,
    enum: ["here", "toGo"],
  },
  //被按讚數
  likes: {
    type: Number,
    default: 0,
  },
  likedBy: [
    { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  }
  ], // 按讚的用戶 ID 列表
  //評論的照片
  photos: {
    type: [String],
    default: [],
  },
  //是否刪除
  isDeleted: {
    type: Boolean,
    default: false,
  },
});

//過濾已標記刪除的資料
commentSchema.pre("find", function () {
  this.where({ isDeleted: false });
});

commentSchema.pre("findOne", function () {
  this.where({ isDeleted: false });
});

module.exports = mongoose.model("Comment", commentSchema);
