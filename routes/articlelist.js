const express = require("express");
const multer = require("multer");
const router = express.Router();
const articleController = require("../controllers/articlelistController");
const notificationMiddleWare = require("../controllers/middlewares/notificationMiddleWare");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 },
});

// 公開讀取（支援分頁、排序 ?page=1&limit=10&sortBy=likes）
router.get("/", articleController.getAllArticles);

// 草稿相關
router.get("/drafts/:userId", articleController.getDrafts);
router.post("/draft", articleController.saveDraft);

// 已發布（個人）
router.get("/published/:userId", articleController.getPublishedArticles);

// 取得單篇
router.get("/:id", articleController.getArticleById);

// 發布文章
router.post("/", upload.array("photo"), articleController.createArticle);

// 修改已發布食記
router.patch("/:id", articleController.updateArticle);

// 刪除食記
router.delete("/:id", articleController.deleteArticle);

// 文章按讚
router.post("/:id/like", articleController.toggleLike, notificationMiddleWare.notifyOnArticleLike);

// 留言
router.post("/:id/comments", articleController.addComment, notificationMiddleWare.notifyOnCommentCreate);
router.delete("/:articleId/comments/:commentId", articleController.deleteComment);
router.post("/:articleId/comments/:commentId/like", articleController.toggleCommentLike, notificationMiddleWare.notifyOnCommentLike);

// 回覆
router.post("/:articleId/comments/:commentId/replies", articleController.addReply, notificationMiddleWare.notifyOnArticleReplyCreate);
router.delete("/:articleId/comments/:commentId/replies/:replyId", articleController.deleteReply);
router.post("/:articleId/comments/:commentId/replies/:replyId/like", articleController.toggleReplyLike, notificationMiddleWare.notifyOnArticleReplyLike);

module.exports = router;
