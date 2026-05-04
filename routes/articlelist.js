const express = require("express");
const multer = require("multer");
const router = express.Router();
const articleController = require("../controllers/articlelistController");
const notificationMiddleWare = require("../controllers/middlewares/notificationMiddleWare");
const { authMiddleware } = require("../controllers/middlewares/authMiddleWare");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 },
});

// 公開讀取（支援分頁、排序 ?page=1&limit=10&sortBy=likes）
router.get("/", articleController.getAllArticles);

// 草稿相關
router.get("/drafts/:userId", authMiddleware, articleController.getDrafts);
router.post("/draft", authMiddleware, articleController.saveDraft);

// 已發布（個人）
router.get("/published/:userId", articleController.getPublishedArticles);

// 取得單篇
router.get("/:id", articleController.getArticleById);

// 發布文章
router.post("/", authMiddleware, upload.array("photo"), articleController.createArticle);

// 修改已發布食記
router.patch("/:id", authMiddleware, articleController.updateArticle);

// 刪除食記
router.delete("/:id", authMiddleware, articleController.deleteArticle);

// 文章按讚
router.post("/:id/like", authMiddleware, articleController.toggleLike, notificationMiddleWare.notifyOnArticleLike);

// 留言
router.post("/:id/comments", authMiddleware, articleController.addComment, notificationMiddleWare.notifyOnArticleCommentCreate);
router.delete("/:articleId/comments/:commentId", authMiddleware, articleController.deleteComment);
router.post("/:articleId/comments/:commentId/like", authMiddleware, articleController.toggleCommentLike, notificationMiddleWare.notifyOnArticleCommentLike);

// 回覆
router.post("/:articleId/comments/:commentId/replies", authMiddleware, articleController.addReply, notificationMiddleWare.notifyOnArticleReplyCreate);
router.delete("/:articleId/comments/:commentId/replies/:replyId", authMiddleware, articleController.deleteReply);
router.post("/:articleId/comments/:commentId/replies/:replyId/like", authMiddleware, articleController.toggleReplyLike, notificationMiddleWare.notifyOnArticleReplyLike);

module.exports = router;
