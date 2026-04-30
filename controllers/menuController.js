const Menu = require('../models/menuModel');
const { uploadPhotos } = require('../utils');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png|gif/;
    const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = fileTypes.test(file.mimetype);
    if (extName && mimeType) {
      return cb(null, true);
    }
    cb(new Error("只允許上傳圖片檔案！"));
  },
});

// 新增菜單
exports.createMenu = async (req, res) => {
  try {
    const { name, description, price, category, storeId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(storeId)) {
      return res.status(400).json({ message: "無效的 Store ID！" });
    }

    if (!name || !price || !category || !storeId) {
      return res.status(400).json({ message: "缺少必要欄位！" });
    }

    const validCategories = ["飲料", "主食", "甜點", "湯品"];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ message: "分類不合法，請選擇正確分類！" });
    }

    let imageUrl = "";
    if (req.file) {
      const urls = await uploadPhotos([req.file]);
      imageUrl = urls[0];
    }

    const menu = new Menu({ name, description, price, category, storeId, imageUrl });
    const savedMenu = await menu.save();
    res.status(200).json(savedMenu);
  } catch (error) {
    console.error("新增失敗：", error);
    res.status(500).json({ message: "新增失敗", error });
  }
};

// 查詢菜單（支援 storeId 直接查詢、名稱/分類/價格篩選、分頁）
exports.getAllMenus = async (req, res) => {
  try {
    const { storeId } = req.query;

    if (!storeId) {
      return res.status(400).json({ message: "缺少 storeId 參數！" });
    }

    if (!mongoose.Types.ObjectId.isValid(storeId)) {
      return res.status(400).json({ message: "無效的 Store ID！" });
    }

    const filter = { storeId: new mongoose.Types.ObjectId(storeId) };

    if (req.query.name) {
      filter.name = { $regex: decodeURIComponent(req.query.name), $options: "i" };
    }

    if (req.query.category) {
      filter.category = { $regex: new RegExp(req.query.category, "i") };
    }

    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice) filter.price.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) filter.price.$lte = parseFloat(req.query.maxPrice);
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [menus, totalCount] = await Promise.all([
      Menu.find(filter)
        .limit(limit)
        .skip(skip)
        .select("name description price category storeId imageUrl isAvailable"),
      Menu.countDocuments(filter),
    ]);

    res.status(200).json({
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      menus,
    });
  } catch (error) {
    res.status(500).json({ message: '查詢失敗', error });
  }
};

// 更新菜單
exports.updateMenu = async (req, res) => {
  try {
    const { name, price, category, description } = req.body;

    const validCategories = ["飲料", "主食", "甜點", "湯品"];
    if (category && !validCategories.includes(category)) {
      return res.status(400).json({ message: "分類不合法，請選擇正確分類！" });
    }

    const updateData = { name, price, category, description };

    if (req.file) {
      const urls = await uploadPhotos([req.file]);
      updateData.imageUrl = urls[0];
    }

    const updatedMenu = await Menu.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updatedMenu) {
      return res.status(404).json({ message: "找不到該菜單資料" });
    }

    res.status(200).json(updatedMenu);
  } catch (error) {
    console.error("更新失敗：", error);
    res.status(500).json({ message: "更新失敗", error });
  }
};

// 切換菜單上架/下架狀態
exports.toggleAvailability = async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id);
    if (!menu) {
      return res.status(404).json({ message: "找不到該菜單資料" });
    }

    menu.isAvailable = !menu.isAvailable;
    await menu.save();
    res.status(200).json({ isAvailable: menu.isAvailable });
  } catch (error) {
    res.status(500).json({ message: "切換狀態失敗", error });
  }
};

// 刪除菜單
exports.deleteMenu = async (req, res) => {
  try {
    const deleted = await Menu.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "找不到該菜單資料" });
    }
    res.status(200).json({ message: "刪除成功" });
  } catch (error) {
    res.status(500).json({ message: "刪除失敗", error });
  }
};
