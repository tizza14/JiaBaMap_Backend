const express = require("express");
const router = express.Router();
const {
  verifyToken,
  googleLogin,
  userRegister,
  userLogin,
  storeLogin,
  storeRegister,
} = require("../controllers/authController");

// 一般用戶
router.post("/user/login/google", googleLogin);
router.post("/user/register", userRegister);
router.post("/user/login", userLogin);
router.post("/user/logout", verifyToken, (req, res) => {
  res.json({ message: "Logout successfully!" });
});

// 店家
router.post("/store/register", storeRegister);
router.post("/store/login", storeLogin);

module.exports = router;
