const express = require("express");
const LinePayController = require("../controllers/linepayController.js");

const router = express.Router();

router.post("/reserve", LinePayController.Payment);
router.get("/confirm", LinePayController.Confirm);
router.get("/cancel", LinePayController.Cancel);

module.exports = router;
