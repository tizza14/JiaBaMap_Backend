const Order = require("../models/orderModel");
const OrderDetail = require("../models/orderDetailModel");
const Store = require("../models/storeModel");
const Menu = require("../models/menuModel");
const mongoose = require("mongoose");

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
  const { customerId, storeId, pickupTime, items, storeName } = req.body;

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
    console.log(error);
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
      restaurantName: order.storeId.name,
      customerId: order.customerId,
      phone: order.storeId.phone,
      address: order.storeId.address,
      totalAmount: order.totalAmount,
      items: orderDetails.items,
      spec: orderDetails.spec,
    };
    res.status(200).json(response);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "取得詳細訂單發生錯誤，請稍後再試" });
  }
};

//更新訂單
const updateOrder = async (req, res) => {
  const { orderId } = req.params;
  const { pickupTime, items } = req.body;
  let updatedFields = {};
  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({ message: "訂單不存在" });
  }
  if (pickupTime) {
    updatedFields.pickupTime = pickupTime;
  }
  if (items && items.length > 0) {
    let totalAmount = await calculateTotalAmount(items);
    updatedFields.totalAmount = totalAmount;

    for (let item of items) {
      console.log(
        `Updating OrderDetail for Order ID: ${order._id}, Product ID: ${item.productId}`,
      );
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
    const order = await Order.findByIdAndUpdate(
      orderId,
      { isDeleted: true },
      { new: true },
    );

    if (!order) {
      return res.status(404).json({ message: "訂單不存在" });
    }
    res.status(200).json({ message: "刪除訂單成功", order });
  } catch (error) {
    res.status(500).json({ message: "刪除訂單發生錯誤，請稍後再試" });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderDetails,
  updateOrder,
  deleteOrder,
};
