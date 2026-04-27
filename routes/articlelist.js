const express = require("express");
const multer = require("multer");
const router = express.Router();
const articleController = require("../controllers/articlelistController");
const notificationMiddleWare = require("../controllers/middlewares/notificationMiddleWare");

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 4 * 1024 * 1024,
  },
});

// 獲取所有文章
router.get("/", articleController.getAllArticles);

// 創建新文章
router.post("/", upload.array("photo"), articleController.createArticle);

// 刪除食記
router.delete("/:id", articleController.deleteArticle);

// 文章按讚/取消按讚
router.post(
  "/:id/like",
  articleController.toggleLike,
  notificationMiddleWare.notifyOnArticleLike,
);

// 添加評論
router.post(
  "/:id/comments",
  articleController.addComment,
  notificationMiddleWare.notifyOnCommentCreate,
);

// 刪除評論
router.delete(
  "/:articleId/comments/:commentId",
  articleController.deleteComment,
);

// 評論按讚/取消按讚
router.post(
  "/:articleId/comments/:commentId/like",
  articleController.toggleCommentLike,
  notificationMiddleWare.notifyOnCommentLike,
);

// 添加回覆
router.post(
  "/:articleId/comments/:commentId/replies",
  articleController.addReply,
  notificationMiddleWare.notifyOnArticleReplyCreate,
);

// 刪除回覆
router.delete(
  "/:articleId/comments/:commentId/replies/:replyId",
  articleController.deleteReply,
);

// 回覆按讚/取消按讚
router.post(
  "/:articleId/comments/:commentId/replies/:replyId/like",
  articleController.toggleReplyLike,
  notificationMiddleWare.notifyOnArticleReplyLike,
);

router.get("/published/:userId", articleController.getPublishedArticles);

// 獲取單篇食記
router.get("/:id", articleController.getArticleById);

// 修改已發布食記
router.patch("/:id", articleController.updateArticle);

module.exports = router;
