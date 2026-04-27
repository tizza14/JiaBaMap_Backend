const express = require("express");
const LinePayController = require("../controllers/linepayController.js");

const router = express.Router();

router.post("/reserve", LinePayController.Payment); //付款請求
router.get("/confirm", LinePayController.Confirm); //付款授權

module.exports = router;