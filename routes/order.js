const express = require("express");
const router = express.Router();
const OrderController = require("../controllers/orderController.js");
const { storeAuthMiddleware } = require("../controllers/middlewares/authMiddleWare");

router.post("/", OrderController.createOrder);
router.get("/store/:storeId", storeAuthMiddleware, OrderController.getStoreOrders);
router.get("/store/:storeId/stats", storeAuthMiddleware, OrderController.getStoreStats);
router.get("/:customerId", OrderController.getOrders);
router.get("/detail/:orderId", OrderController.getOrderDetails);
router.put("/:orderId", OrderController.updateOrder);
router.patch("/:orderId/status", storeAuthMiddleware, OrderController.updateOrderStatus);
router.delete("/:orderId", OrderController.deleteOrder);

module.exports = router;
