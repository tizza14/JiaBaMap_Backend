const mongoose = require("mongoose");
const User = require("../models/usersModel");
const Store = require("../models/storeModel");
const { generateToken } = require("../utils");

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const TEST_USER = {
  name: "測試用戶",
  email: "test@jiabamap.dev",
  password: "Test1234!",
};

const TEST_STORE = {
  username: "teststore",
  password: "Test1234!",
  storeName: "測試店家",
};

const seed = async () => {
  let uri = process.env.MONGO_URI;
  if (!uri) {
    const { MongoMemoryServer } = require("mongodb-memory-server");
    const mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
  }
  await mongoose.connect(uri);

  // 建立測試用戶
  let user = await User.findOne({ email: TEST_USER.email });
  if (!user) {
    user = await User.create(TEST_USER);
    console.log("✔ 測試用戶已建立");
  } else {
    console.log("✔ 測試用戶已存在");
  }
  const userToken = generateToken({ id: user._id });

  // 建立測試店家
  let store = await Store.findOne({ username: TEST_STORE.username });
  if (!store) {
    store = await Store.create(TEST_STORE);
    console.log("✔ 測試店家已建立");
  } else {
    console.log("✔ 測試店家已存在");
  }
  const storeToken = generateToken({ id: store._id, placeId: store.placeId });

  console.log("\n========== 測試帳號資訊 ==========");
  console.log("【用戶】");
  console.log("  Email   :", TEST_USER.email);
  console.log("  密碼    :", TEST_USER.password);
  console.log("  Token   :", userToken);
  console.log("\n【店家】");
  console.log("  帳號    :", TEST_STORE.username);
  console.log("  密碼    :", TEST_STORE.password);
  console.log("  Token   :", storeToken);
  console.log("===================================\n");

  await mongoose.disconnect();
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
