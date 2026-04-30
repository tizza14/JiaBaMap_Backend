const Store = require("../models/storeModel");

const createStore = async (req, res) => {
  try {
    const store = new Store({ ...req.body.form });
    const savedStore = await store.save();
    res.status(201).json(savedStore);
  } catch (error) {
    console.log("建立餐廳失敗：", error);
    res.status(500).json({ message: "餐廳新增失敗，請稍後再試" });
  }
};

const getStore = async (req, res) => {
  const stores = await Store.find();
  res.status(200).json(stores);
};

const getStoreByPlace = async (req, res) => {
  const placeId = req.params.placeId;
  const store = await Store.find({ placeId });
  if (store.length > 0) {
    res.status(200).json(store[0]);
  } else {
    res.status(202).json({ message: "未註冊餐廳" });
  }
};

const getStoreIdByName = async (req, res) => {
  const { storeName } = req.params;
  let store = await Store.findOne({ storeName });
  if (!store) {
    store = await Store.findOne().sort({ createdAt: -1 });
  }
  if (store) {
    res.status(200).json({ _id: store._id });
  } else {
    res.status(404).json({ message: "未找到任何商店" });
  }
};

// 取得單一店家資料（供店家後台使用）
const getStoreById = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id).select(
      "-password"
    );
    if (!store) {
      return res.status(404).json({ message: "找不到店家資料" });
    }
    res.status(200).json(store);
  } catch (error) {
    res.status(500).json({ message: "取得店家資料失敗" });
  }
};

// 更新店家資料
const updateStore = async (req, res) => {
  try {
    const { id } = req.params;
    // 確保只能更新自己的資料
    if (req.store.id !== id) {
      return res.status(403).json({ message: "無權限修改此店家資料" });
    }

    const allowedFields = [
      "storeName", "storeAddress", "storePhone", "storeIntro",
      "contactName", "contactEmail", "contactPhone",
      "businessHours", "paymentOptions",
    ];
    const updateData = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    });

    const updated = await Store.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).select("-password");

    if (!updated) {
      return res.status(404).json({ message: "找不到店家資料" });
    }
    res.status(200).json(updated);
  } catch (error) {
    console.error("更新店家資料失敗：", error);
    res.status(500).json({ message: "更新失敗，請稍後再試" });
  }
};

module.exports = {
  createStore,
  getStore,
  getStoreByPlace,
  getStoreIdByName,
  getStoreById,
  updateStore,
};
