const mongoose = require("mongoose");
const Store = require("../models/storeModel");

// 連接到 MongoDB
mongoose.connect("mongodb://localhost:27017/test");

const seedStores = async () => {
  // 清除現有的餐廳資料
  await Store.deleteMany({});

  // 新增餐廳種子資料
  const stores = [
    {
      username: "restaurant1",
      password: "password123",
      storeName: "幸福牛肉湯",
      storeAddress: "台北市中正區愛國東路123號",
      storePhone: "0912345678",
      storeIntro: "提供新鮮美味的牛肉湯。",
      storeTaxId: "12345678",
      contactName: "王小明",
      contactEmail: "contact@beefsoup.com",
      contactPhone: "0987654321",
      placeId: "ChIJN1t_tDeuEmsRUsoyG83frY4",
      businessHours: {
        Monday: "09:00 AM - 09:00 PM",
        Tuesday: "09:00 AM - 09:00 PM",
        Wednesday: "09:00 AM - 09:00 PM",
        Thursday: "09:00 AM - 09:00 PM",
        Friday: "09:00 AM - 09:00 PM",
        Saturday: "10:00 AM - 08:00 PM",
        Sunday: "Closed",
      },
      image: ["https://storage.googleapis.com/test-bucket/image1.jpg"],
      paymentOptions: ["cash", "credit_card"],
    },
    {
      username: "restaurant2",
      password: "password456",
      storeName: "快樂炒飯",
      storeAddress: "台北市信義區松仁路456號",
      storePhone: "0923456789",
      storeIntro: "招牌炒飯，平價美味。",
      storeTaxId: "87654321",
      contactName: "李小華",
      contactEmail: "contact@friedrice.com",
      contactPhone: "0976543210",
      placeId: "ChIJN2t_yDeuEmsRUsoyG83frY5",
      businessHours: {
        Monday: "10:00 AM - 10:00 PM",
        Tuesday: "10:00 AM - 10:00 PM",
        Wednesday: "10:00 AM - 10:00 PM",
        Thursday: "10:00 AM - 10:00 PM",
        Friday: "10:00 AM - 10:00 PM",
        Saturday: "10:00 AM - 10:00 PM",
        Sunday: "10:00 AM - 09:00 PM",
      },
      image: ["https://storage.googleapis.com/test-bucket/image2.jpg"],
      paymentOptions: ["online", "cash"],
    },
    {
      username: "restaurant3",
      password: "password789",
      storeName: "12:59早午餐Brunch.Pasta.Coffee.Dessert",
      storeAddress: "台灣台北市萬華區昆明街257巷14號1樓",
      storePhone: "02 2302 6163",
      storeIntro: "超級豐盛的早午餐盤，從地瓜、雞腿、太陽蛋到生菜",
      storeTaxId: "07654345",
      contactName: "林小明",
      contactEmail: "contact@friedrice.com",
      contactPhone: "0976543210",
      placeId: "XhIJN2t_yDeuEoeHyjoyG83frY5",
      businessHours: {
        Monday: "10:00 AM - 10:00 PM",
        Tuesday: "10:00 AM - 10:00 PM",
        Wednesday: "10:00 AM - 10:00 PM",
        Thursday: "10:00 AM - 10:00 PM",
        Friday: "10:00 AM - 10:00 PM",
        Saturday: "10:00 AM - 10:00 PM",
        Sunday: "10:00 AM - 09:00 PM",
      },
      image: ["https://storage.googleapis.com/test-bucket/image2.jpg"],
      paymentOptions: ["online", "cash"],
    },
  ];

  // 插入種子資料
  await Store.insertMany(stores);
  console.log("餐廳資料新增成功");

  // 關閉連線
  mongoose.connection.close();
};

// 執行種子函數
seedStores().catch((err) => {
  console.error("資料新增失敗", err);
  mongoose.connection.close();
});
