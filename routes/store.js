const express = require("express");
const router = express.Router();
const storeController = require("../controllers/storeController");

router.post("/", storeController.createStore); //新增餐廳

router.get("/getAll", storeController.getStore);

router.get("/get/:placeId", storeController.getStoreByPlace);

router.get("/getIdByName/:demoStoreName", storeController.getStoreIdByName);

module.exports = router;
