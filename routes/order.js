const express = require("express");
const router = express.Router();
const OrderController = require("../controllers/orderController.js");

router.post("/", OrderController.createOrder); //新增訂單
router.get("/:customerId", OrderController.getOrders); //取得使用者或店家所有訂單
router.get("/detail/:orderId", OrderController.getOrderDetails); //取得詳細訂單
router.put("/:orderId", OrderController.updateOrder); //更新訂單
router.delete("/:orderId", OrderController.deleteOrder); //刪除訂單

module.exports = router;
