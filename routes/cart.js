const express = require("express");
const router = express.Router();
const controller = require("../controllers/cartController");

router.get("/get/:userId/:placeId", controller.getCartByUserAndPlace); //獲取購物車

router.post("/", controller.addCart); //新增購物車

module.exports = router;
