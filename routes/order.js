const express = require("express");
const router = express.Router();
const OrderController = require("../controllers/orderController.js");
const { authMiddleware, storeAuthMiddleware } = require("../controllers/middlewares/authMiddleWare");

router.post("/", authMiddleware, OrderController.createOrder);
router.get("/store/:storeId", storeAuthMiddleware, OrderController.getStoreOrders);
router.get("/store/:storeId/stats", storeAuthMiddleware, OrderController.getStoreStats);
router.get("/:customerId", authMiddleware, OrderController.getOrders);
router.get("/detail/:orderId", authMiddleware, OrderController.getOrderDetails);
router.put("/:orderId", authMiddleware, OrderController.updateOrder);
router.patch("/:orderId/status", storeAuthMiddleware, OrderController.updateOrderStatus);
router.delete("/:orderId", authMiddleware, OrderController.deleteOrder);

module.exports = router;
