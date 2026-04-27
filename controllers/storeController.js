const Store = require("../models/storeModel");

//新增店家
const createStore = async (req, res) => {
  try {
    const store = new Store({
      ...req.body.form,
    });

    const savedStore = await store.save();
    res.status(201).json(savedStore);
  } catch (error) {
    console.log("建立餐廳失敗：", error);
    res.status(500).json({ message: "餐廳新增失敗，請稍後再試" });
  }
};

const getStore = async (req, res) => {
  const getStore = await Store.find();
  res.status(200).json(getStore);
};

const getStoreByPlace = async (req, res) => {
  const placeId = req.params.placeId;
  console.log(placeId);
  
  const getStore = await Store.find({ placeId: placeId });
  if(getStore.length > 0){
    res.status(200).json();
  }else{
    res.status(202).json({ message: "未註冊餐廳" })
  }
};

const getStoreIdByName = async (req, res) => {
  const { storeName } = req.params;
  let store = await Store.findOne({ storeName: storeName });
  if (!store) {
    store = await Store.findOne().sort({ createdAt: -1 });
  }
  if (store) {
    res.status(200).json({ _id: store._id });
  } else {
    res.status(404).json({ message: "未找到任何商店" });
  }
};

module.exports = {
  createStore,
  getStore,
  getStoreByPlace,
  getStoreIdByName,
};
