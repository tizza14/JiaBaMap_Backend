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

// Public article reads
router.get("/", articleController.getAllArticles);
router.get("/published/:userId", articleController.getPublishedArticles);
router.get("/:id", articleController.getArticleById);

// Drafts
router.get("/drafts/:userId", authMiddleware, articleController.getDrafts);
router.post("/draft", authMiddleware, articleController.saveDraft);

// Article writes
router.post("/", authMiddleware, upload.array("photo"), articleController.createArticle);
router.patch("/:id", authMiddleware, articleController.updateArticle);
router.delete("/:id", authMiddleware, articleController.deleteArticle);

// Article likes
router.post("/:id/like", authMiddleware, articleController.toggleLike, notificationMiddleWare.notifyOnArticleLike);

// Comments
router.post("/:id/comments", authMiddleware, articleController.addComment, notificationMiddleWare.notifyOnArticleCommentCreate);
router.delete("/:articleId/comments/:commentId", authMiddleware, articleController.deleteComment);
router.post("/:articleId/comments/:commentId/like", authMiddleware, articleController.toggleCommentLike, notificationMiddleWare.notifyOnArticleCommentLike);

// Replies
router.post("/:articleId/comments/:commentId/replies", authMiddleware, articleController.addReply, notificationMiddleWare.notifyOnArticleReplyCreate);
router.delete("/:articleId/comments/:commentId/replies/:replyId", authMiddleware, articleController.deleteReply);
router.post("/:articleId/comments/:commentId/replies/:replyId/like", authMiddleware, articleController.toggleReplyLike, notificationMiddleWare.notifyOnArticleReplyLike);

module.exports = router;
