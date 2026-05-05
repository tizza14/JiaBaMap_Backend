const Article = require('../models/articlelistModel');
const { createStorage } = require('../utils');

// 上傳圖片到 GCS
async function uploadArticlePhotos(files) {
  const storage = createStorage();
  const bucketName = process.env.BUCKET_NAME;
  const photoUrls = [];
  for (const file of files) {
    const fileName = `article/${Date.now()}_${encodeURIComponent(file.originalname)}`;
    await storage.bucket(bucketName).file(fileName).save(file.buffer);
    photoUrls.push(`${process.env.GOOGLE_CLOUD_STORAGE_BASE_URL}${bucketName}/${fileName}`);
  }
  return photoUrls;
}

// 取得所有已發布文章（支援分頁與排序）
exports.getAllArticles = async (req, res) => {
  try {
    const userId = req.query.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sortBy === 'likes' ? { likesCount: -1 } : { createdAt: -1 };
    const skip = (page - 1) * limit;

    const [articles, totalCount] = await Promise.all([
      Article.find({ status: 'published' })
        .sort(sortBy)
        .skip(skip)
        .limit(limit)
        .select('-__v'),
      Article.countDocuments({ status: 'published' }),
    ]);

    const articlesWithLikeStatus = articles.map((article) => {
      const obj = article.toObject();
      if (userId) {
        obj.isLiked = article.likedBy.includes(userId);
        obj.comments = article.comments.map((comment) => {
          const commentObj = comment.toObject();
          commentObj.isLiked = comment.likedBy.includes(userId);
          commentObj.replies = comment.replies.map((reply) => {
            const replyObj = reply.toObject();
            replyObj.isLiked = reply.likedBy.includes(userId);
            return replyObj;
          });
          return commentObj;
        });
      }
      return obj;
    });

    res.json({
      articles: articlesWithLikeStatus,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 發布文章（修正 race condition：先 save 再回應）
exports.createArticle = async (req, res) => {
  const { userId, placeId, title, content, user, userPhoto, eatdate, restaurantName } = req.body;

  if (!userId || !user || !restaurantName || !title || !content || !eatdate) {
    return res.status(400).json({ message: "userId、用戶名稱、餐廳名稱、標題、內容、用餐日期為必填" });
  }

  try {
    const photoUrls = req.files?.length ? await uploadArticlePhotos(req.files) : [];

    const article = new Article({
      userId,
      placeId,
      title,
      content,
      user,
      userPhoto,
      restaurantName,
      photo: photoUrls,
      eatdateAt: new Date(eatdate),
      status: 'published',
    });

    await article.save();
    res.status(200).json({ message: '食記已成功建立', articleId: article._id });
  } catch (error) {
    res.status(500).json({ message: error.message || "建立食記失敗" });
  }
};

// 儲存草稿至資料庫（建立或更新）
exports.saveDraft = async (req, res) => {
  try {
    const { userId, draftId, title, content, restaurantName, placeId, eatdate, user, userPhoto } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId 為必填" });
    }

    if (draftId) {
      const draft = await Article.findOneAndUpdate(
        { _id: draftId, userId, status: 'draft' },
        {
          title: title || '未命名草稿',
          content: content || '',
          restaurantName: restaurantName || '',
          placeId: placeId || '',
          eatdateAt: eatdate ? new Date(eatdate) : undefined,
          updatedAt: new Date(),
        },
        { new: true }
      );
      if (!draft) return res.status(404).json({ message: "找不到草稿" });
      return res.status(200).json({ draftId: draft._id, message: '草稿已更新' });
    }

    const draft = new Article({
      userId,
      user: user || 'unknown',
      userPhoto: userPhoto || '',
      title: title || '未命名草稿',
      content: content || '',
      restaurantName: restaurantName || '',
      placeId: placeId || '',
      photo: [],
      status: 'draft',
      eatdateAt: eatdate ? new Date(eatdate) : new Date(),
    });
    await draft.save();
    res.status(201).json({ draftId: draft._id, message: '草稿已儲存' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 取得用戶的所有草稿
exports.getDrafts = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ message: "userId 為必填" });

    const drafts = await Article.find({ userId, status: 'draft' })
      .select('title restaurantName updatedAt createdAt _id')
      .sort({ updatedAt: -1 });

    res.set('Cache-Control', 'no-store');
    res.json(drafts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 取得已發布文章（個人）
exports.getPublishedArticles = async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!userId) return res.status(400).json({ message: 'userId 為必填' });

    const articles = await Article.find({ userId, status: 'published' })
      .sort({ createdAt: -1 });
    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 取得單篇文章
exports.getArticleById = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ message: 'Article not found' });
    res.json(article);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 更新已發布文章
exports.updateArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, restaurantName, placeId, photo, eatdate } = req.body;

    if (!title || !content || !eatdate) {
      return res.status(400).json({ message: "標題、內容、用餐日期為必填" });
    }

    const updatedArticle = await Article.findByIdAndUpdate(
      id,
      { title, content, restaurantName, placeId, photo, eatdateAt: new Date(eatdate), updatedAt: new Date() },
      { new: true }
    );

    if (!updatedArticle) return res.status(404).json({ message: 'Article not found' });
    res.json(updatedArticle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 刪除文章
exports.deleteArticle = async (req, res) => {
  try {
    const deleted = await Article.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: '找不到文章' });
    res.status(200).json({ message: '文章已成功刪除' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── 按讚邏輯 ────────────────────────────────────────────────────────

const handleLike = (doc, userId) => {
  const isLiked = doc.likedBy.includes(userId);
  if (isLiked) {
    doc.likedBy = doc.likedBy.filter((id) => id !== userId);
    doc.likesCount = Math.max(0, doc.likesCount - 1);
  } else {
    doc.likedBy.push(userId);
    doc.likesCount++;
  }
  return { isLiked: !isLiked, likesCount: doc.likesCount, likedBy: doc.likedBy };
};

exports.toggleLike = async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId 為必填' });

    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ message: 'Article not found' });

    const isLikedBefore = article.likedBy.includes(userId);
    const result = handleLike(article, userId);
    await article.save();

    // 將結果存入 locals 供後續 middleware (通知) 使用
    res.locals.likeResult = { ...result, isNewLike: !isLikedBefore };
    
    // 先回傳結果給前端，提升反應速度
    res.status(200).json(result);
    
    // 只有在「新增按讚」時才觸發通知
    if (!isLikedBefore) {
      next();
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addComment = async (req, res, next) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ message: 'Article not found' });

    const { content, userId, user, userPhoto } = req.body;
    if (!content || !userId || !user) {
      return res.status(400).json({ message: '內容、userId、用戶名稱為必填' });
    }

    const newComment = {
      content: content.trim(),
      userId, user,
      userPhoto: userPhoto || '',
      createdAt: new Date(),
      likedBy: [], likesCount: 0, replies: [],
    };

    article.comments.push(newComment);
    article.updatedAt = new Date();
    await article.save();

    const createdComment = article.comments[article.comments.length - 1];
    
    // 存入 locals 供通知使用
    res.locals.savedComment = createdComment;
    res.locals.article = article;

    res.status(201).json({
      _id: createdComment._id, content: createdComment.content,
      userId: createdComment.userId, user: createdComment.user,
      userPhoto: createdComment.userPhoto, createdAt: createdComment.createdAt,
      likesCount: 0, isLiked: false, replies: [],
    });

    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const result = await Article.findByIdAndUpdate(
      req.params.articleId,
      { $pull: { comments: { _id: req.params.commentId } } },
      { new: true }
    );
    if (!result) return res.status(404).json({ message: 'Comment not found' });
    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.toggleCommentLike = async (req, res, next) => {
  try {
    const { articleId, commentId } = req.params;
    const { userId } = req.body;

    const article = await Article.findById(articleId);
    if (!article) return res.status(404).json({ message: 'Article not found' });

    const comment = article.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const isLikedBefore = comment.likedBy.includes(userId);
    const result = handleLike(comment, userId);
    await article.save();

    res.status(200).json(result);

    if (!isLikedBefore) {
      next();
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addReply = async (req, res, next) => {
  try {
    const article = await Article.findById(req.params.articleId);
    if (!article) return res.status(404).json({ message: 'Article not found' });

    const comment = article.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const { content, userId, user, userPhoto } = req.body;
    if (!content || !userId || !user) {
      return res.status(400).json({ message: '內容、userId、用戶名稱為必填' });
    }

    const newReply = {
      content: content.trim(), userId, user,
      userPhoto: userPhoto || '', createdAt: new Date(),
      likedBy: [], likesCount: 0,
    };

    comment.replies.push(newReply);
    article.updatedAt = new Date();
    await article.save();

    const createdReply = comment.replies[comment.replies.length - 1];
    res.status(201).json({
      _id: createdReply._id, content: createdReply.content,
      userId: createdReply.userId, user: createdReply.user,
      userPhoto: createdReply.userPhoto, createdAt: createdReply.createdAt,
      likesCount: 0, isLiked: false,
    });

    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteReply = async (req, res) => {
  try {
    const { articleId, commentId, replyId } = req.params;
    const article = await Article.findById(articleId);
    if (!article) return res.status(404).json({ message: 'Article not found' });

    const comment = article.comments.find((c) => c._id.toString() === commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const replyIndex = comment.replies.findIndex((r) => r._id.toString() === replyId);
    if (replyIndex === -1) return res.status(404).json({ message: 'Reply not found' });

    comment.replies.splice(replyIndex, 1);
    await article.save();
    res.status(200).json({ message: '回覆已刪除' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.toggleReplyLike = async (req, res, next) => {
  try {
    const { articleId, commentId, replyId } = req.params;
    const { userId } = req.body;

    const article = await Article.findById(articleId);
    if (!article) return res.status(404).json({ message: 'Article not found' });

    const comment = article.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const reply = comment.replies.id(replyId);
    if (!reply) return res.status(404).json({ message: 'Reply not found' });

    const isLikedBefore = reply.likedBy.includes(userId);
    const result = handleLike(reply, userId);
    await article.save();

    res.status(200).json(result);

    if (!isLikedBefore) {
      next();
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
