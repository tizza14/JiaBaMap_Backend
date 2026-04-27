const Menu = require('../models/menuModel');
const { uploadPhotos } = require('../utils');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const Store = require("../models/storeModel");


// 使用記憶體儲存，不儲存在本地檔案系統
const storage = multer.memoryStorage();

// 限制上傳檔案大小與格式
const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 限制檔案大小為 2MB
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png|gif/; // 限制格式
    const extName = fileTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    const mimeType = fileTypes.test(file.mimetype);

    if (extName && mimeType) {
      return cb(null, true);
    } else {
      cb(new Error("只允許上傳圖片檔案！"));
    }
  },
});

// 新增菜單
exports.createMenu = async (req, res) => {
  try {
    // 資料驗證 - 檢查必填欄位
    const { name, description, price, category, storeId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(storeId)) {
      return res.status(400).json({ message: "無效的 Store ID！" });
    }

    if (!name || !price || !category || !storeId) {
      return res.status(400).json({ message: "缺少必要欄位！" });
    }

    // 檢查分類是否合法
    const validCategories = ["飲料", "主食", "甜點", "湯品"]; // 可擴展分類
    if (!validCategories.includes(category)) {
      return res.status(400).json({ message: "分類不合法，請選擇正確分類！" });
    }

    // 上傳圖片到 GCS
    let imageUrl = "";
    if (req.file) {
      // 單張圖片處理
      const urls = await uploadMenuPhotos([req.file]); // 使用 GCS 上傳
      imageUrl = urls[0]; // 儲存第一張圖片的 URL
    }

    // 建立菜單資料
    const menu = new Menu({
      name,
      description, // 新增描述
      price,
      category,
      storeId,
      imageUrl, // 存入圖片 URL
    });

    // 儲存資料到資料庫
    const savedMenu = await menu.save();
    res.status(200).json(savedMenu);
  } catch (error) {
    console.error("新增失敗：", error);
    res.status(500).json({ message: "新增失敗", error });
  }
};

// 查詢菜單 (支援名稱、分類、價格篩選與分頁)
exports.getAllMenus = async (req, res) => {
  try {
    // 檢查 storeId 是否存在於查詢參數中
    // const { storeId } = req.query;
    const { placeId } = req.query
    
    const store = await Store.findOne({ placeId: placeId });
    const storeId = store._id
    
    if (!storeId) {
      return res.status(400).json({ message: "缺少 storeId 參數！" });
    }

    // 驗證 storeId 是否為有效的 ObjectId
    if (!mongoose.Types.ObjectId.isValid(storeId)) {
      return res.status(400).json({ message: "無效的 Store ID！" });
    }

    // 建立查詢條件，將 storeId 字串轉換為 ObjectId
    const filter = { storeId: new mongoose.Types.ObjectId(storeId) };

    // 新增名稱搜尋條件 (支援模糊搜尋)
    if (req.query.name) {
      const decodedName = decodeURIComponent(req.query.name); // 解碼 URL 編碼的中文
      filter.name = { $regex: decodedName, $options: "i" }; // 模糊搜尋 (大小寫不敏感)
    }

    // 分類篩選
    if (req.query.category) {
      filter.category = { $regex: new RegExp(req.query.category, "i") }; // 忽略大小寫
    }

    // 最低價格篩選
    if (req.query.minPrice) {
      filter.price = { $gte: parseFloat(req.query.minPrice) }; // $gte: >= 最小價格
    }

    // 最高價格篩選
    if (req.query.maxPrice) {
      filter.price = {
        ...filter.price, // 保留之前的條件
        $lte: parseFloat(req.query.maxPrice), // $lte: <= 最大價格
      };
    }

    // 2. 分頁設定
    const page = parseInt(req.query.page) || 1; // 第幾頁 (預設第 1 頁)
    const limit = parseInt(req.query.limit) || 50; // 每頁筆數 (預設 50 筆)
    const skip = (page - 1) * limit; // 計算跳過多少筆資料

    // 3. 查詢資料並套用篩選和分頁
    const menus = await Menu.find(filter) // 套用篩選條件
      .limit(limit) // 限制每頁筆數
      .skip(skip) // 跳過資料
      .select("name description price category storeId imageUrl isAvailable");

    // 4. 計算資料總數 (不受分頁影響)
    const totalCount = await Menu.countDocuments(filter);

// 5. 回傳結果
res.status(200).json({
  totalCount, // 總資料數
  totalPages: Math.ceil(totalCount / limit), // 總頁數
  currentPage: page, // 當前頁數
  menus // 資料內容
});
} catch (error) {
res.status(202).json({ message: '查詢失敗', error });
}
};

// 更新菜單
exports.updateMenu = async (req, res) => {
  try {
    const { name, price, category, description } = req.body;

    const { storeId } = req.body;

    if (storeId) {
      if (!mongoose.Types.ObjectId.isValid(storeId)) {
        return res.status(400).json({ message: "無效的 Store ID！" });
      }
      updateData.storeId = storeId;
    }

    // 確認分類是否合法
    const validCategories = ["飲料", "主食", "甜點", "湯品"]; // 可擴展分類
    if (category && !validCategories.includes(category)) {
      return res.status(400).json({ message: "分類不合法，請選擇正確分類！" });
    }

    // 組合更新資料
    const updateData = {
      name,
      price,
      category,
      description, // 確保描述欄位被更新
    };

    // 上傳新圖片
    if (req.file) {
      const urls = await uploadPhotos([req.file]);
      updateData.imageUrl = urls[0]; // 更新圖片 URL
    }

    // 更新資料
    const updatedMenu = await Menu.findByIdAndUpdate(
      req.params.id, // 根據 ID 更新
      updateData, // 更新資料內容
      { new: true }, // 回傳更新後資料
    );

    // 如果找不到該菜單
    if (!updatedMenu) {
      return res.status(404).json({ message: "找不到該菜單資料" });
    }

    // 成功回傳更新結果
    res.status(200).json(updatedMenu);
  } catch (error) {
    console.error("更新失敗：", error);
    res.status(500).json({ message: "更新失敗", error });
  }
};

// 刪除菜單
exports.deleteMenu = async (req, res) => {
  try {
    await Menu.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "刪除成功" });
  } catch (error) {
    res.status(500).json({ message: "刪除失敗", error });
  }
};
