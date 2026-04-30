const express = require("express");
const router = express.Router();
const menuController = require("../controllers/menuController");
const { storeAuthMiddleware } = require("../controllers/middlewares/authMiddleWare");
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });

// 查詢菜單（公開，顧客端也需要讀取）
router.get("/", menuController.getAllMenus);

// 以下操作需要店家身份驗證
router.post("/", storeAuthMiddleware, upload.single("image"), menuController.createMenu);
router.put("/:id", storeAuthMiddleware, upload.single("image"), menuController.updateMenu);
router.patch("/:id/availability", storeAuthMiddleware, menuController.toggleAvailability);
router.delete("/:id", storeAuthMiddleware, menuController.deleteMenu);

module.exports = router;
