const express = require("express");
const router = express.Router();
const controller = require("../controllers/userController");
const { authMiddleware } = require("../controllers/middlewares/authMiddleWare");
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
  authMiddleware,
  upload.single("profilePicture"),
  controller.updateProfile,
);

router.post("/favorites/:id", authMiddleware, controller.addFavorites)

router.delete("/favorites/delete/:id", authMiddleware, controller.delFavorites)

router.get("/test", (req, res) => {
  res.json({ message: "test" });
});

module.exports = router;
