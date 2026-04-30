const mongoose = require("mongoose");
const User = require("../models/usersModel");
const Store = require("../models/storeModel");
const Menu = require("../models/menuModel");
const Order = require("../models/orderModel");
const OrderDetail = require("../models/orderDetailModel");
const Article = require("../models/articlelistModel");
const Notification = require("../models/notificationModel");
const Comment = require("../models/commentsModel");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const TEST_USER_A = {
  name: "展示用戶 A (作者)",
  email: "demo-user@jiabamap.dev",
  password: "DemoUser123!",
  profilePicture: "https://api.dicebear.com/7.x/avataaars/svg?seed=UserA",
};

const TEST_USER_B = {
  name: "展示用戶 B (互動者)",
  email: "test@jiabamap.dev",
  password: "Test1234!",
  profilePicture: "https://api.dicebear.com/7.x/avataaars/svg?seed=UserB",
};

const TEST_STORE = {
  username: "demostore",
  password: "DemoStore123!",
  storeName: "呷飽精品咖啡館",
  storeAddress: "台北市信義區忠孝東路五段 8 號",
  storePhone: "02-2722-1234",
  storeIntro: "我們提供全台灣最頂級的手沖咖啡與精緻手作甜點，是您放鬆的最佳去處。",
  placeId: "ChIJPaS3h6WrQjQRvTj7S9WJ-0k", 
  businessHours: {
    monday: "09:00-21:00",
    tuesday: "09:00-21:00",
    wednesday: "09:00-21:00",
    thursday: "09:00-21:00",
    friday: "09:00-22:00",
    saturday: "10:00-22:00",
    sunday: "10:00-20:00",
  },
};

const SAMPLE_MENU = [
  { name: "招牌手沖精品咖啡", price: 180, category: "飲料", description: "來自衣索比亞的精品豆，淺焙口感帶有清新果香。" },
  { name: "拿鐵咖啡", price: 150, category: "飲料", description: "濃郁義式濃縮與綿密奶泡的完美結合。" },
  { name: "冰滴咖啡", price: 200, category: "飲料", description: "低溫慢速萃取 12 小時，口感滑順回甘。" },
  { name: "宇治抹茶戚風蛋糕", price: 220, category: "甜點", description: "日本直送抹茶粉製作，口感蓬鬆濕潤。" },
  { name: "法式焦糖布丁", price: 120, category: "甜點", description: "手作焦糖與滑順蛋香，大人口味的甜點。" },
  { name: "經典肉桂捲", price: 110, category: "甜點", description: "濃郁辛香肉桂與淋上特製糖霜，甜而不膩。" },
  { name: "美式牛肉三明治", price: 280, category: "主食", description: "嚴選培根、起司與鮮嫩牛肉，飽足感十足。" },
  { name: "明太子奶油燻雞義大利麵", price: 320, category: "主食", description: "濃郁奶油與鹹香明太子，是店內的超人氣主食。" },
];

const seedDemoData = async () => {
  try {
    console.log("正在連接資料庫...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("資料庫連接成功，開始建立展示資料...");

    // 1. 清理舊資料
    const oldUsers = await User.find({ email: { $in: [TEST_USER_A.email, TEST_USER_B.email] } }).select("_id").lean();
    const oldStore = await Store.findOne({ username: TEST_STORE.username }).select("_id").lean();
    const oldUserIds = oldUsers.map(u => u._id);
    if (oldUserIds.length) {
      await Order.deleteMany({ customerId: { $in: oldUserIds } });
      await OrderDetail.deleteMany({});
    }
    if (oldStore) {
      await Order.deleteMany({ storeId: oldStore._id });
      await OrderDetail.deleteMany({});
      await Menu.deleteMany({ storeId: oldStore._id });
    }
    await User.deleteMany({ email: { $in: [TEST_USER_A.email, TEST_USER_B.email] } });
    await Store.deleteMany({ username: TEST_STORE.username });
    await Article.deleteMany({ userId: { $in: oldUserIds.map(id => id.toString()) } });
    await Notification.deleteMany({});
    await Comment.deleteMany({});
    
    // 2. 建立測試用戶
    const userA = await User.create(TEST_USER_A);
    const userB = await User.create(TEST_USER_B);
    console.log("✔ 兩名展示用戶已建立");

    // 3. 建立測試店家
    const store = await Store.create(TEST_STORE);
    console.log("✔ 展示店家已建立");

    // 4. 建立菜單資料
    const menuItems = SAMPLE_MENU.map(item => ({ ...item, storeId: store._id }));
    const createdMenus = await Menu.insertMany(menuItems);
    console.log(`✔ 已為店家建立 ${createdMenus.length} 個菜單項目`);

    // 5. 為兩名用戶建立訂單
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const dayBeforeYesterday = new Date(today);
    dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);

    const orderDefs = [
      {
        customerId: userA._id,
        storeId: store._id,
        storeName: store.storeName,
        items: [{ productId: createdMenus[0]._id.toString(), productName: createdMenus[0].name, price: createdMenus[0].price, quantity: 1 }],
        totalAmount: 180,
        status: "completed",
        isPaid: true,
        pickupName: "展示用戶 A",
        pickupPhone: "0912-345-678",
        pickupTime: dayBeforeYesterday,
        orderTime: dayBeforeYesterday
      },
      {
        customerId: userA._id,
        storeId: store._id,
        storeName: store.storeName,
        items: [
          { productId: createdMenus[1]._id.toString(), productName: createdMenus[1].name, price: createdMenus[1].price, quantity: 1 },
          { productId: createdMenus[5]._id.toString(), productName: createdMenus[5].name, price: createdMenus[5].price, quantity: 1 }
        ],
        totalAmount: 260,
        status: "completed",
        isPaid: true,
        pickupName: "展示用戶 A",
        pickupPhone: "0912-345-678",
        pickupTime: yesterday,
        orderTime: yesterday
      },
      {
        customerId: userA._id,
        storeId: store._id,
        storeName: store.storeName,
        items: [{ productId: createdMenus[3]._id.toString(), productName: createdMenus[3].name, price: createdMenus[3].price, quantity: 1 }],
        totalAmount: 220,
        status: "cancelled",
        isPaid: false,
        orderTime: dayBeforeYesterday
      },
      {
        customerId: userB._id,
        storeId: store._id,
        storeName: store.storeName,
        items: [{ productId: createdMenus[2]._id.toString(), productName: createdMenus[2].name, price: createdMenus[2].price, quantity: 2 }],
        totalAmount: 400,
        status: "preparing",
        isPaid: true,
        pickupName: "展示用戶 B",
        pickupPhone: "0923-456-789",
        pickupTime: today,
        orderTime: today
      },
      {
        customerId: userB._id,
        storeId: store._id,
        storeName: store.storeName,
        items: [{ productId: createdMenus[6]._id.toString(), productName: createdMenus[6].name, price: createdMenus[6].price, quantity: 1 }],
        totalAmount: 280,
        status: "ready",
        isPaid: true,
        pickupName: "展示用戶 B",
        pickupPhone: "0923-456-789",
        pickupTime: today,
        orderTime: today
      },
      {
        customerId: userB._id,
        storeId: store._id,
        storeName: store.storeName,
        items: [{ productId: createdMenus[7]._id.toString(), productName: createdMenus[7].name, price: createdMenus[7].price, quantity: 1 }],
        totalAmount: 320,
        status: "pending",
        isPaid: false,
        orderTime: today
      }
    ];
    const createdOrders = await Order.insertMany(orderDefs);

    // 為每筆訂單建立 OrderDetail（CheckoutDetail 頁面需要此資料）
    const orderDetails = createdOrders.map(order => ({
      orderId: order._id,
      items: order.items,
      totalAmount: order.totalAmount,
    }));
    await OrderDetail.insertMany(orderDetails);
    console.log(`✔ 已為兩名用戶建立 ${createdOrders.length} 筆展示訂單及對應 OrderDetail（含全部5種狀態）`);

    // 6. 建立展示食記 (互相按讚與留言)
    const artA = await Article.create({
      userId: userA._id.toString(),
      user: userA.name,
      userPhoto: userA.profilePicture,
      title: "【User A】信義區最愛的精品咖啡館",
      content: "這家店的氛圍真的很棒，尤其是他們的手沖咖啡，香氣十足，推薦大家來試試！環境也很安靜，適合帶電腦來工作。",
      restaurantName: store.storeName,
      placeId: store.placeId,
      photo: ["https://images.unsplash.com/photo-1509042239860-f550ce710b93", "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085"],
      eatdateAt: yesterday,
      status: "published",
      likesCount: 1,
      likedBy: [userB._id.toString()],
      comments: [
        {
          userId: userB._id.toString(),
          user: userB.name,
          userPhoto: userB.profilePicture,
          content: "這家我也去過！抹茶蛋糕真的超好吃的～下次可以試試！",
          createdAt: today,
          likesCount: 1,
          likedBy: [userA._id.toString()],
          replies: [
            {
              userId: userA._id.toString(),
              user: userA.name,
              userPhoto: userA.profilePicture,
              content: "好喔！下次一定要點抹茶蛋糕來吃吃看！",
              createdAt: today
            }
          ]
        }
      ]
    });

    const artB = await Article.create({
      userId: userB._id.toString(),
      user: userB.name,
      userPhoto: userB.profilePicture,
      title: "【User B】驚艷的抹茶戚風蛋糕！",
      content: "沒想到在這裡能吃到這麼道地的抹茶味，蛋糕體非常濕潤且帶有微苦的抹茶香，完全不會太甜！拿鐵也很順口。",
      restaurantName: store.storeName,
      placeId: store.placeId,
      photo: ["https://images.unsplash.com/photo-1559925393-8be0ec4767c8", "https://images.unsplash.com/photo-1515442261904-6c5079361582"],
      eatdateAt: today,
      status: "published",
      likesCount: 1,
      likedBy: [userA._id.toString()],
    });

    // User A 的草稿食記（展示 draft 功能）
    await Article.create({
      userId: userA._id.toString(),
      user: userA.name,
      userPhoto: userA.profilePicture,
      title: "【草稿】下次想去的新開幕甜點店",
      content: "最近看到一間新開的甜點店，感覺環境很美，等去過之後再補上心得～",
      restaurantName: "",
      placeId: "",
      photo: [],
      eatdateAt: today,
      status: "draft"
    });
    console.log("✔ 已為兩名用戶建立展示食記（含已發布、留言、回覆、草稿）");

    // 7. 建立餐廳評論 (Comment Model)
    await Comment.create({
      userId: userA._id.toString(),
      placeId: store.placeId,
      content: "手沖咖啡品質非常穩定，店員服務親切。內用空間稍微小一點，但很有氣氛。",
      rating: 5,
      AvgPrice: 200,
      style: "here",
      photos: ["https://images.unsplash.com/photo-1497933321027-944a39d7ad6c"]
    });

    await Comment.create({
      userId: userB._id.toString(),
      placeId: store.placeId,
      content: "蛋糕超讚！外帶回去口感依然很好，包裝也很精緻。",
      rating: 4,
      AvgPrice: 150,
      style: "toGo"
    });
    console.log("✔ 已建立餐廳評論");

    // 8. 建立展示通知
    const orderPreparing = createdOrders.find(o => o.status === "preparing");
    const orderReady = createdOrders.find(o => o.status === "ready");
    const orderPending = createdOrders.find(o => o.status === "pending");

    const notifications = [
      // 給 User A 的通知
      {
        userId: userA._id,
        actionType: "like",
        relatedType: "article",
        relatedId: artA._id,
        userName: userB.name,
        userImg: userB.profilePicture
      },
      {
        userId: userA._id,
        actionType: "comment",
        relatedType: "article",
        relatedId: artA._id,
        userName: userB.name,
        userImg: userB.profilePicture,
        metadata: { articleId: artA._id, originalContent: "這家我也去過！抹茶蛋糕真的超好吃的～下次可以試試！" }
      },
      // 給 User B 的通知
      {
        userId: userB._id,
        actionType: "like",
        relatedType: "article",
        relatedId: artB._id,
        userName: userA.name,
        userImg: userA.profilePicture
      },
      {
        userId: userB._id,
        actionType: "reply",
        relatedType: "article",
        relatedId: artA._id,
        userName: userA.name,
        userImg: userA.profilePicture,
        metadata: { articleId: artA._id, replyId: artA.comments[0].replies[0]._id, originalContent: "好喔！下次一定要點抹茶蛋糕來吃吃看！" }
      },
      {
        userId: userB._id,
        actionType: "order_status",
        relatedType: "order",
        relatedId: orderPreparing._id,
        storeName: store.storeName,
        metadata: { originalContent: "您的訂單正在製作中。" }
      },
      {
        userId: userB._id,
        actionType: "order_status",
        relatedType: "order",
        relatedId: orderReady._id,
        storeName: store.storeName,
        metadata: { originalContent: "您的訂單已完成，請前往取餐。" }
      },
      // 給 店家的通知
      {
        userId: store._id,
        actionType: "new_order",
        relatedType: "order",
        relatedId: orderPending._id,
        userName: userB.name,
        metadata: { orderTotal: 320 }
      }
    ];
    await Notification.insertMany(notifications);
    console.log("✔ 已建立完整的通知紀錄（按讚、留言、回覆、訂單製作中、訂單待取、新訂單）");

    // 9. 設定收藏
    userA.favorites = [store.placeId];
    await userA.save();
    userB.favorites = [store.placeId];
    await userB.save();
    console.log("✔ 已設定用戶收藏清單");

    console.log("\n==============================================");
    console.log("🎉 展示資料建立完成！請使用以下帳號進行演示：");
    console.log("----------------------------------------------");
    console.log("【一般用戶 A (作者)】");
    console.log(`  帳號 (Email) : ${TEST_USER_A.email}`);
    console.log(`  密碼         : ${TEST_USER_A.password}`);
    console.log("----------------------------------------------");
    console.log("【一般用戶 B (互動者)】");
    console.log(`  帳號 (Email) : ${TEST_USER_B.email}`);
    console.log(`  密碼         : ${TEST_USER_B.password}`);
    console.log("----------------------------------------------");
    console.log("【店家帳號】");
    console.log(`  帳號 (Username): ${TEST_STORE.username}`);
    console.log(`  密碼           : ${TEST_STORE.password}`);
    console.log("==============================================\n");

  } catch (error) {
    console.error("建立資料失敗:", error);
  } finally {
    await mongoose.disconnect();
  }
};

seedDemoData();
