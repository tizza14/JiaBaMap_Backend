const mongoose = require("mongoose");
const Order = require("../models/orderModel");
const Store = require("../models/storeModel");
const User = require("../models/usersModel");

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/test");
    console.log("MongoDB connected...");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

const seedOrders = async () => {
  try {
    const user = await User.findOne(); // 获取一个用户ID作为customerId
    const store = await Store.findOne(); // 获取一个商店ID作为storeId

    // 假设提供的菜单项
    const menuItems = [
      {
        productId: "101",
        productName: "牛肉湯",
        price: 200,
        quantity: 2,
      },
      {
        productId: "102",
        productName: "雞肉飯",
        price: 150,
        quantity: 1,
      },
      {
        productId: "103",
        productName: "抹茶蛋糕",
        price: 120,
        quantity: 1,
      },
    ];

    const totalAmount = menuItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );

    const newOrder = new Order({
      customerId: user._id,
      storeId: store._id,
      storeName: store.name, // 假设Store模型有name字段
      items: menuItems,
      totalAmount: totalAmount, // 計算總金額 (200*2 + 150*1 + 120*1)
      pickupTime: new Date(Date.now() + 3600000), // 一個小時後取貨
      isPaid: true,
    });

    await newOrder.save();
    console.log("Seed order added!");
  } catch (error) {
    console.error("Error seeding orders:", error);
  } finally {
    mongoose.connection.close();
  }
};

connectDB().then(() => seedOrders());
