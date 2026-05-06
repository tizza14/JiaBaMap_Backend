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

// User auth
router.post("/user/login/google", googleLogin);
router.post("/user/register", userRegister);
router.post("/user/login", userLogin);
router.post("/user/logout", verifyToken, (req, res) => {
  res.json({ message: "Logout successfully!" });
});

// Store auth
router.post("/store/register", storeRegister);
router.post("/store/login", storeLogin);

module.exports = router;
