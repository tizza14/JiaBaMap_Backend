const mongoose = require("mongoose");
const OrderDetail = require("../models/orderDetailModel");
const Order = require("../models/orderModel");
const Menu = require("../models/menuModel");

mongoose.connect("mongodb://localhost:27017/test");

const seedOrderDetails = async () => {
  // 取得訂單資料
  const orders = await Order.find();
  // 取得產品資料
  const products = await Menu.find();

  const orderDetails = [
    {
      orderId: orders[0]._id, // 第一筆訂單的 ID
      productId: products[0]._id, // 第一個產品的 ID
      quantity: 2,
      note: "加辣",
      spec: "大份",
    },
    {
      orderId: orders[0]._id, // 第一筆訂單的 ID
      productId: products[1]._id, // 第二個產品的 ID
      quantity: 1,
      note: "不要洋蔥",
      spec: "小份",
    },
    {
      orderId: orders[1]._id, // 第二筆訂單的 ID
      productId: products[2]._id, // 第三個產品的 ID
      quantity: 3,
      note: "",
      spec: "中份",
    },
  ];

  await OrderDetail.insertMany(orderDetails);
  console.log("訂單詳細資料種子插入成功");
  mongoose.connection.close();
};

seedOrderDetails();
