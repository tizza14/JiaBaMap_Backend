const express = require("express");
const router = express.Router();
const storeController = require("../controllers/storeController");
const { storeAuthMiddleware } = require("../controllers/middlewares/authMiddleWare");

router.post("/", storeController.createStore);
router.get("/getAll", storeController.getStore);
router.get("/get/:placeId", storeController.getStoreByPlace);
router.get("/getIdByName/:demoStoreName", storeController.getStoreIdByName);
router.get("/:id", storeAuthMiddleware, storeController.getStoreById);
router.put("/:id", storeAuthMiddleware, storeController.updateStore);

module.exports = router;
