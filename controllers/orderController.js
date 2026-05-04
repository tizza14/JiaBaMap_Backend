const Order = require("../models/orderModel");
const OrderDetail = require("../models/orderDetailModel");
const Store = require("../models/storeModel");
const Menu = require("../models/menuModel");
const mongoose = require("mongoose");
const { createNotification } = require("./notificationController");

//計算總金額
const calculateTotalAmount = async (items) => {
  let totalAmount = 0;
  for (let item of items) {
    const product = await Menu.findById(item.productId);
    if (product) {
      totalAmount += product.price * item.quantity;
    } else {
      console.error(`Product with ID ${item.productId} not found`);
    }
  }
  return totalAmount;
};

//新增訂單
const createOrder = async (req, res) => {
  const { storeId, pickupTime, items, storeName } = req.body;
  const customerId = req.user.id;

  const totalAmount = await calculateTotalAmount(items);
  let order = await Order.findOne({ customerId, storeId, isDeleted: false });

  if (order) {
    order.pickupTime = pickupTime || order.pickupTime;
    order.storeName = storeName || order.storeName;

    items.forEach((newItem) => {
      const existingItem = order.items.find(
        (item) => item.productId === newItem.productId,
      );
      if (existingItem) {
        // 如果商品已存在，更新数量
        existingItem.quantity += newItem.quantity;
      } else {
        // 如果商品不存在，添加到 items
        order.items.push(newItem);
      }
    });

    order.totalAmount = order.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    await order.save();

    await OrderDetail.deleteMany({ orderId: order._id });
  } else {
    order = new Order({
      customerId,
      storeId,
      pickupTime,
      totalAmount,
      storeName,
      items,
    });

    await order.save();
  }
  const orderDetails = items.map((item) => ({
    orderId: order._id,
    items: order.items,
    totalAmount: order.totalAmount,
    note: item.note,
    spec: item.spec,
  }));
  const savedOrder = await OrderDetail.insertMany(orderDetails);

  // 建立通知發送給店家
  try {
    await createNotification({
      receiverId: storeId,
      actionUserId: customerId,
      actionType: "new_order",
      relatedId: order._id,
      relatedType: "order",
      additionalData: {
        userName: "新顧客",
        orderTotal: totalAmount,
        storeName: storeName
      }
    });
  } catch (err) {
    console.error("發送訂單通知給店家失敗:", err);
  }

  try {
    res.status(201).json({
      message: order.isNew ? "成功建立訂單" : "成功更新訂單",
      order,
      orderDetails: savedOrder,
    });
  } catch (error) {
    res.status(500).json({ message: "建立訂單發生錯誤，請稍後再試" });
  }
};

//依照使用者id/店家id 取得所有未刪除訂單
const getOrders = async (req, res) => {
  const { customerId } = req.params;
  if (req.user.id !== customerId) {
    return res.status(403).json({ message: "Forbidden" });
  }
  const filter = {
    isDeleted: false,
    customerId: customerId,
  };

  const orders = await Order.find(filter).populate("storeName").lean();
  try {
    if (!orders || orders.length === 0) {
      return res.status(202).json({ message: "沒有找到訂單" });
    }

    const response = orders.map((order) => ({
      orderId: order._id,
      restaurantName: order.storeName,
      customerId: order.customerId,
      totalAmount: order.totalAmount,
      itemsLength: order.items.length,
      orderTime: order.orderTime,
      isPaid: order.isPaid,
    }));
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: "取得訂單發生錯誤，請稍後再試" });
  }
};

//依照訂單id取得詳細訂單
const getOrderDetails = async (req, res) => {
  const { orderId } = req.params;

  // 查詢訂單
  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).send("訂單未找到");
  }
  if (req.user.id !== order.customerId?.toString()) {
    return res.status(403).json({ message: "Forbidden" });
  }
  const storeId = order.storeId; // 從訂單中提取 storeId

  // 查詢店家詳細資訊
  const store = await Store.findById(storeId).select(
    "storeName storeAddress storePhone",
  );
  if (!store) {
    return res.status(404).send("店家未找到");
  }

  try {
    const orderDetails = await OrderDetail.findOne({ orderId: orderId });

    const response = {
      storeName: store.storeName,
      storeAddress: store.storeAddress,
      storePhone: store.storePhone,
      orderId: order._id,
      customerId: order.customerId,
      totalAmount: order.totalAmount,
      pickupName: order.pickupName,
      pickupPhone: order.pickupPhone,
      pickupTime: order.pickupTime,
      isPaid: order.isPaid,
      items: orderDetails.items,
      spec: orderDetails.spec,
    };
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: "取得詳細訂單發生錯誤，請稍後再試" });
  }
};

//更新訂單
const updateOrder = async (req, res) => {
  const { orderId } = req.params;
  const { pickupTime, pickupName, pickupPhone, items } = req.body;
  let updatedFields = {};
  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({ message: "訂單不存在" });
  }
  if (req.user.id !== order.customerId?.toString()) {
    return res.status(403).json({ message: "Forbidden" });
  }
  if (pickupTime) {
    updatedFields.pickupTime = new Date(pickupTime);
  }
  if (pickupName !== undefined) {
    updatedFields.pickupName = pickupName;
  }
  if (pickupPhone !== undefined) {
    updatedFields.pickupPhone = pickupPhone;
  }
  if (items && items.length > 0) {
    let totalAmount = await calculateTotalAmount(items);
    updatedFields.totalAmount = totalAmount;

    for (let item of items) {
      await OrderDetail.findOneAndUpdate(
        { orderId: order._id, productId: item.productId },
        { $set: { quantity: item.quantity, note: item.note, spec: item.spec } },
        { new: true },
      );
    }
  }

  try {
    const updatedOrder = await Order.findByIdAndUpdate(orderId, updatedFields, {
      new: true,
      upsert: false,
    });

    res.status(200).json({ message: "更新訂單成功", updatedOrder });
  } catch (error) {
    res.status(500).json({ message: "更新訂單發生錯誤，請稍後再試" });
  }
};

//刪除訂單
const deleteOrder = async (req, res) => {
  const { orderId } = req.params;
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "訂單不存在" });
    }
    if (req.user.id !== order.customerId?.toString()) {
      return res.status(403).json({ message: "Forbidden" });
    }
    await Order.findByIdAndUpdate(orderId, { isDeleted: true });
    res.status(200).json({ message: "刪除訂單成功" });
  } catch (error) {
    res.status(500).json({ message: "刪除訂單發生錯誤，請稍後再試" });
  }
};

// 取得店家所有訂單
const getStoreOrders = async (req, res) => {
  const { storeId } = req.params;
  const { status, page = 1, limit = 20 } = req.query;

  try {
    const filter = {
      storeId: new mongoose.Types.ObjectId(storeId),
      isDeleted: false,
    };
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [orders, totalCount] = await Promise.all([
      Order.find(filter)
        .sort({ orderTime: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Order.countDocuments(filter),
    ]);

    res.status(200).json({
      totalCount,
      totalPages: Math.ceil(totalCount / parseInt(limit)),
      currentPage: parseInt(page),
      orders: orders.map((o) => ({
        orderId: o._id,
        customerId: o.customerId,
        totalAmount: o.totalAmount,
        status: o.status,
        isPaid: o.isPaid,
        pickupTime: o.pickupTime,
        orderTime: o.orderTime,
        items: o.items,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: "取得店家訂單失敗" });
  }
};

// 取得店家統計數字（供 Dashboard 使用）
const getStoreStats = async (req, res) => {
  const { storeId } = req.params;

  try {
    const storeObjId = new mongoose.Types.ObjectId(storeId);
    const baseFilter = { storeId: storeObjId, isDeleted: false };

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [totalOrders, activeOrders, todayRevenue] = await Promise.all([
      Order.countDocuments(baseFilter),
      Order.countDocuments({
        ...baseFilter,
        status: { $in: ["pending", "preparing", "ready"] },
      }),
      Order.aggregate([
        {
          $match: {
            storeId: storeObjId,
            isDeleted: false,
            isPaid: true,
            orderTime: { $gte: todayStart },
          },
        },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
    ]);

    res.status(200).json({
      totalOrders,
      activeOrders,
      todayRevenue: todayRevenue[0]?.total || 0,
    });
  } catch (error) {
    res.status(500).json({ message: "取得統計資料失敗" });
  }
};

// 更新訂單狀態
const updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  const validStatuses = ["pending", "preparing", "ready", "completed", "cancelled"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "無效的訂單狀態" });
  }

  try {
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );
    if (!order) {
      return res.status(404).json({ message: "訂單不存在" });
    }

    // 發送通知給顧客
    try {
      const statusMap = {
        preparing: "正在製作中",
        ready: "已完成，請前往取餐",
        completed: "已完成交易",
        cancelled: "已被取消"
      };
      
      if (statusMap[status]) {
        await createNotification({
          receiverId: order.customerId,
          actionUserId: order.storeId,
          actionType: "order_status",
          relatedId: order._id,
          relatedType: "order",
          additionalData: {
            statusText: statusMap[status],
            storeName: order.storeName || "餐廳"
          }
        });
      }
    } catch (err) {
      console.error("發送狀態通知給顧客失敗:", err);
    }

    res.status(200).json({ message: "狀態更新成功", status: order.status });
  } catch (error) {
    res.status(500).json({ message: "更新狀態失敗" });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderDetails,
  updateOrder,
  deleteOrder,
  getStoreOrders,
  getStoreStats,
  updateOrderStatus,
};
