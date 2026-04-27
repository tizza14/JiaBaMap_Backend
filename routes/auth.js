const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const {
  googleLogin,
  verifyToken,
  storeLogin,
} = require("../controllers/authController");

router.post("/user/login/google", googleLogin);

router.post("/user/logout", verifyToken, (req, res) => {
  res.json({ message: "Logout successfully!" });
});

router.post("/store/login", storeLogin);

module.exports = router;
