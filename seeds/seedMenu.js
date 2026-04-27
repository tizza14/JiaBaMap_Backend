const mongoose = require("mongoose");
const Menu = require("../models/menuModel.js");

mongoose.connect("mongodb://localhost:27017/test");

const seedMenus = async () => {
  try {
    const menus = [
      {
        name: "牛肉湯",
        price: 200,
        category: "湯品",
        isAvailable: true,
        description: "美味的牛肉湯，讓人回味無窮",
        storeId: "677e19b5bcca16696987efb7", // 假設這是現有的 Store ID
        itemId: 101,
        imageUrl: "https://example.com/image1.jpg",
      },
      {
        name: "雞肉飯",
        price: 150,
        category: "主食",
        isAvailable: true,
        description: "鮮嫩多汁的雞肉飯",
        storeId: "677e19b5bcca16696987efb7", // 假設這是現有的 Store ID
        itemId: 102,
        imageUrl: "https://example.com/image2.jpg",
      },
      {
        name: "抹茶蛋糕",
        price: 120,
        category: "甜點",
        isAvailable: true,
        description: "香濃的抹茶蛋糕，適合下午茶",
        storeId: "677e19b5bcca16696987efb7", // 假設這是現有的 Store ID
        itemId: 103,
        imageUrl: "https://example.com/image3.jpg",
      },
    ];

    await Menu.insertMany(menus);
    console.log("菜單資料新增成功");
  } catch (error) {
    console.error("菜單資料新增失敗", error);
  } finally {
    mongoose.connection.close();
  }
};

seedMenus();
