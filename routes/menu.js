const express = require("express");
const router = express.Router();
const menuController = require("../controllers/menuController"); // 引入 Controller
const multer = require("multer");

// 設定 Multer 接收圖片檔案 (記憶體儲存)
const upload = multer({ storage: multer.memoryStorage() });

// 新增菜單
router.post(
  "/",
  upload.single("image"), // 接收單張圖片上傳
  menuController.createMenu,
  /* 
    #swagger.summary = '新增菜單'
    #swagger.description = '新增一筆菜單資料，包含圖片上傳功能'
  */
  /* 
    #swagger.consumes = ['multipart/form-data']
    #swagger.parameters['image'] = {
      in: 'formData',
      description: '上傳圖片 (jpeg, jpg, png, gif)',
      required: false,
      type: 'file'
    }
  */
  /* 
    #swagger.parameters['name'] = {
      in: 'formData',
      description: '菜單名稱',
      required: true,
      type: 'string'
    }
  */
  /* 
    #swagger.parameters['price'] = {
      in: 'formData',
      description: '價格',
      required: true,
      type: 'number'
    }
  */
  /* 
    #swagger.parameters['category'] = {
      in: 'formData',
      description: '分類 (飲料、主食、甜點、湯品)',
      required: true,
      type: 'string'
    }
  */
  /* 
    #swagger.parameters['storeId'] = {
      in: 'formData',
      description: '餐廳 ID',
      required: true,
      type: 'string'
    }
  */
  /* 
    #swagger.responses[200] = {
      description: '新增成功',
      schema: {
        _id: '1234567890',
        name: '牛肉湯',
        price: 200,
        category: '湯品',
        storeId: '67720e635123faace157e5b3',
        imageUrl: 'https://storage.googleapis.com/test-bucket/image1.jpg'
      }
    }
  */
);

// 查詢所有菜單
router.get(
  "/",
  menuController.getAllMenus,
  /* 
    #swagger.summary = '查詢所有菜單'
    #swagger.description = '支援名稱、分類、價格篩選與分頁功能。'
  */
  /* 
    #swagger.parameters['name'] = {
      in: 'query',
      description: '根據名稱模糊搜尋',
      required: false,
      type: 'string'
    }
  */
  /* 
    #swagger.parameters['category'] = {
      in: 'query',
      description: '根據分類篩選',
      required: false,
      type: 'string'
    }
  */
  /* 
    #swagger.parameters['page'] = {
      in: 'query',
      description: '分頁：第幾頁',
      required: false,
      type: 'integer'
    }
  */
  /* 
    #swagger.responses[200] = {
      description: '查詢成功',
      schema: {
        totalCount: 100,
        totalPages: 10,
        currentPage: 1,
        menus: [
          {
            _id: '1234567890',
            name: '牛肉湯',
            price: 200,
            category: '湯品',
            storeId: '67720e635123faace157e5b3',
            imageUrl: 'https://storage.googleapis.com/test-bucket/image1.jpg'
          }
        ]
      }
    }
  */
);

// 更新菜單
router.put(
  "/:id",
  upload.single("image"), // 接收單張圖片上傳
  menuController.updateMenu,
  /* 
    #swagger.summary = '更新菜單'
    #swagger.description = '更新指定菜單資料，包含圖片上傳功能'
  */
  /* 
    #swagger.consumes = ['multipart/form-data']
    #swagger.parameters['id'] = {
      in: 'path',
      description: '菜單 ID',
      required: true,
      type: 'string'
    }
  */
  /* 
    #swagger.parameters['image'] = {
      in: 'formData',
      description: '上傳圖片 (jpeg, jpg, png, gif)',
      required: false,
      type: 'file'
    }
  */
  /* 
    #swagger.parameters['name'] = {
      in: 'formData',
      description: '菜單名稱',
      required: false,
      type: 'string'
    }
  */
  /* 
    #swagger.parameters['price'] = {
      in: 'formData',
      description: '價格',
      required: false,
      type: 'number'
    }
  */
  /* 
    #swagger.parameters['category'] = {
      in: 'formData',
      description: '分類 (飲料、主食、甜點、湯品)',
      required: false,
      type: 'string'
    }
  */
  /* 
    #swagger.responses[200] = {
      description: '更新成功',
      schema: {
        _id: '1234567890',
        name: '牛肉湯',
        price: 250,
        category: '湯品',
        storeId: '67720e635123faace157e5b3',
        imageUrl: 'https://storage.googleapis.com/test-bucket/image1.jpg'
      }
    }
  */
);

// 刪除菜單
router.delete(
  "/:id",
  menuController.deleteMenu, // 使用 Controller 處理邏輯
  /* 
    #swagger.summary = '刪除菜單'
    #swagger.description = '刪除指定的菜單'
  */
  /* 
    #swagger.parameters['id'] = {
      in: 'path',
      description: '菜單 ID',
      required: true,
      type: 'string'
    }
  */
);

module.exports = router; // 匯出路由
