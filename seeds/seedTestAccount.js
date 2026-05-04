const mongoose = require("mongoose");
const User = require("../models/usersModel");
const Store = require("../models/storeModel");
const Menu = require("../models/menuModel");
const { generateToken } = require("../utils");

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const TEST_USER = { name: "測試用戶", email: "test@jiabamap.dev", password: "Test1234!" };
const TEST_STORE = {
  username: "teststore",
  password: "Test1234!",
  storeName: "測試店家",
  storeAddress: "台北市信義區忠孝東路五段 8 號",
  storePhone: "0277221234",
  storeIntro: "這是用於本地開發測試的示範店家。",
  contactName: "測試負責人",
  contactEmail: "teststore@jiabamap.dev",
  contactPhone: "0912345678",
  placeId: "ChIJPaS3h6WrQjQRvTj7S9WJ-0k",
  businessHours: { 一: "09:00-21:00", 二: "09:00-21:00", 三: "09:00-21:00", 四: "09:00-21:00", 五: "09:00-22:00", 六: "10:00-22:00", 日: "10:00-20:00" },
  paymentOptions: ["cash", "online", "linepay"],
};
const SAMPLE_MENU = [
  { name: "招牌手沖咖啡", price: 180, category: "飲料", description: "衣索比亞精品豆，淺焙果香。" },
  { name: "拿鐵", price: 150, category: "飲料", description: "濃郁義式濃縮與綿密奶泡。" },
  { name: "抹茶戚風蛋糕", price: 220, category: "甜點", description: "日本抹茶粉，口感蓬鬆濕潤。" },
  { name: "法式焦糖布丁", price: 120, category: "甜點", description: "手作焦糖，滑順蛋香。" },
  { name: "美式牛肉三明治", price: 280, category: "主食", description: "培根、起司與鮮嫩牛肉。" },
  { name: "奶油燻雞義大利麵", price: 320, category: "主食", description: "濃郁奶油，店內超人氣主食。" },
];

// 供 app.js 在 in-memory 模式啟動後呼叫（mongoose 已連線）
const seedDevData = async () => {
  let user = await User.findOne({ email: TEST_USER.email });
  if (!user) user = await User.create(TEST_USER);

  let store = await Store.findOne({ username: TEST_STORE.username });
  if (!store) store = await Store.create(TEST_STORE);

  const menuCount = await Menu.countDocuments({ storeId: store._id });
  if (menuCount === 0) {
    await Menu.insertMany(SAMPLE_MENU.map((item) => ({ ...item, storeId: store._id })));
  }

  const userToken = generateToken({ id: user._id });
  const storeToken = generateToken({ id: store._id, placeId: store.placeId });

  console.log("\n========== 本機測試帳號 ==========");
  console.log("【用戶】  Email: test@jiabamap.dev  密碼: Test1234!");
  console.log("         Token:", userToken);
  console.log("【店家】  帳號: teststore  密碼: Test1234!");
  console.log("         Token:", storeToken);
  console.log("===================================\n");
};

// 直接執行（node seeds/seedTestAccount.js）
const runStandalone = async () => {
  let uri = process.env.MONGO_URI;
  if (!uri) {
    const { MongoMemoryServer } = require("mongodb-memory-server");
    const mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
    console.log("Using in-memory MongoDB:", uri);
  }
  await mongoose.connect(uri);
  await seedDevData();
  await mongoose.disconnect();
};

if (require.main === module) {
  runStandalone().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { seedDevData };
