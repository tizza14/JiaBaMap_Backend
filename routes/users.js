const express = require("express");
const router = express.Router();
const controller = require("../controllers/userController");
const { verifyToken } = require("../controllers/authController");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 4 * 1024 * 1024,
  },
});

router.get("/:id", controller.getProfile);

router.put(
  "/update/:id",
  verifyToken,
  upload.single("profilePicture"),
  controller.updateProfile,
);

router.post("/favorites/:id", controller.addFavorites)

router.delete("/favorites/delete/:id", controller.delFavorites)

router.get("/test", (req, res) => {
  res.json({ message: "test" });
});

module.exports = router;
