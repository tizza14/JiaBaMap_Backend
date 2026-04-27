const Comment = require("../../models/commentsModel");
const Article = require("../../models/articlelistModel");
const notificationController = require("../notificationController");

// 新增評論後觸發通知
const notifyOnCommentCreate = async (req, res, next) => {
  try {
    const { userId, placeId } = req.body;
    const savedComment = res.locals.savedComment;

    if (!savedComment) {
      return next();
    }

    // 創建通知
    await notificationController.createNotification({
      receiverId: placeId, // 餐廳相關的接收者
      actionUserId: userId,
      actionType: "comment",
      relatedId: savedComment._id,
      relatedType: "restaurant_comment",
    });

    next();
  } catch (error) {
    console.error("創建評論通知失敗:", error);
    next(error);
  }
};

// 更新評論讚數後觸發通知
const notifyOnCommentLike = async (req, res, next) => {
  try {
    const { id: commentId } = req.params;
    const userId = req.body.userId; // 從請求體獲取用戶ID

    if (!userId) {
      return next();
    }

    const comment = await Comment.findById(commentId);
    
    if (comment) {
      await notificationController.createNotification({
        receiverId: comment.userId,
        actionUserId: userId,
        actionType: "like",
        relatedId: commentId,
        relatedType: "restaurant_comment_like",
      });
    }

    next();
  } catch (error) {
    console.error("創建按讚通知失敗:", error);
    next(error);
  }
};

// 文章新增評論後觸發通知
const notifyOnArticleCommentCreate = async (req, res, next) => {
  try {
    const { articleId } = req.params;
    const { userId, user } = req.body;

    const article = await Article.findById(articleId);
    if (!article) {
      return next();
    }

    await notificationController.createNotification({
      receiverId: article.userId, // 文章作者
      actionUserId: userId,
      actionType: "comment",
      relatedId: articleId,
      relatedType: "article_comment",
      additionalData: {
        commenterName: user
      }
    });

    next();
  } catch (error) {
    console.error("創建文章評論通知失敗:", error);
    next(error);
  }
};

// 文章按讚後觸發通知
const notifyOnArticleLike = async (req, res, next) => {
  try {
    const { id: articleId } = req.params;
    const { userId } = req.body;

    const article = await Article.findById(articleId);
    if (!article) {
      return next();
    }

    await notificationController.createNotification({
      receiverId: article.userId,
      actionUserId: userId,
      actionType: "like",
      relatedId: articleId,
      relatedType: "article_like"
    });

    next();
  } catch (error) {
    console.error("創建文章按讚通知失敗:", error);
    next(error);
  }
};

// 文章評論按讚後觸發通知
const notifyOnArticleCommentLike = async (req, res, next) => {
  try {
    const { articleId, commentId } = req.params;
    const { userId } = req.body;

    const article = await Article.findById(articleId);
    if (!article) {
      return next();
    }

    const comment = article.comments.id(commentId);
    if (!comment) {
      return next();
    }

    await notificationController.createNotification({
      receiverId: comment.userId,
      actionUserId: userId,
      actionType: "like",
      relatedId: commentId,
      relatedType: "article_comment_like",
      additionalData: {
        articleId
      }
    });

    next();
  } catch (error) {
    console.error("創建文章評論按讚通知失敗:", error);
    next(error);
  }
};

// 文章回覆評論後觸發通知
const notifyOnArticleReplyCreate = async (req, res, next) => {
  try {
    const { articleId, commentId } = req.params;
    const { userId, user } = req.body;

    const article = await Article.findById(articleId);
    if (!article) {
      return next();
    }

    const comment = article.comments.id(commentId);
    if (!comment) {
      return next();
    }

    await notificationController.createNotification({
      receiverId: comment.userId,
      actionUserId: userId,
      actionType: "reply",
      relatedId: commentId,
      relatedType: "article_comment_reply",
      additionalData: {
        articleId,
        replierName: user
      }
    });

    next();
  } catch (error) {
    console.error("創建回覆通知失敗:", error);
    next(error);
  }
};

// 文章回覆按讚後觸發通知
const notifyOnArticleReplyLike = async (req, res, next) => {
  try {
    const { articleId, commentId, replyId } = req.params;
    const { userId } = req.body;

    const article = await Article.findById(articleId);
    if (!article) {
      return next();
    }

    const comment = article.comments.id(commentId);
    if (!comment) {
      return next();
    }

    const reply = comment.replies.id(replyId);
    if (!reply) {
      return next();
    }

    await notificationController.createNotification({
      receiverId: reply.userId,
      actionUserId: userId,
      actionType: "like",
      relatedId: replyId,
      relatedType: "article_reply_like",
      additionalData: {
        articleId,
        commentId
      }
    });

    next();
  } catch (error) {
    console.error("創建回覆按讚通知失敗:", error);
    next(error);
  }
};

module.exports = {
  notifyOnCommentCreate,
  notifyOnCommentLike,
  notifyOnArticleCommentCreate,
  notifyOnArticleLike,
  notifyOnArticleCommentLike,
  notifyOnArticleReplyCreate,
  notifyOnArticleReplyLike
};