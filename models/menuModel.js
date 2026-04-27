const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "名稱為必填項目"],
    maxlength: 100,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  category: {
    type: String,
    maxlength: 50,
    required: [true, "分類為必填項目"],
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  description: {
    type: String,
    maxlength: 65535,
  },
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Store",
    required: true,
  },
  itemId: {
    type: Number,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  imageUrl: {
    type: String,
    default: "",
  },
});

const Menu = mongoose.model("Menu", menuSchema);

module.exports = Menu;
