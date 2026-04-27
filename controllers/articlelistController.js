const Article = require('../models/articlelistModel');
const { uploadPhotos } = require("../utils");
const { Storage } = require("@google-cloud/storage");

exports.getAllArticles = async (req, res) => {
  try {
    const userId = req.query.userId;  // 從查詢參數獲取用戶ID
    const articles = await Article.find().sort({ createdAt: -1 });

    // 如果有用戶ID，檢查每篇文章的按讚狀態
    const articlesWithLikeStatus = articles.map(article => {
      const articleObj = article.toObject();
      if (userId) {
        // 檢查文章是否被當前用戶按讚
        articleObj.isLiked = article.likedBy.includes(userId);

        // 檢查評論的按讚狀態
        articleObj.comments = article.comments.map(comment => {
          const commentObj = comment.toObject();
          commentObj.isLiked = comment.likedBy.includes(userId);

          // 檢查回覆的按讚狀態
          commentObj.replies = comment.replies.map(reply => {
            const replyObj = reply.toObject();
            replyObj.isLiked = reply.likedBy.includes(userId);
            return replyObj;
          });

          return commentObj;
        });
      }
      return articleObj;
    });

    res.json(articlesWithLikeStatus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createArticle = async (req, res) => {
  const { userId, placeId, title, content, photo, user, userPhoto, eatdate, restaurantName } = req.body;
  
  if (!userId || !restaurantName || !title || !content || !eatdate) {
      return res.status(400).json({ 
        message: "UserId, placeId, title, eatdate and content are required" 
      });
    }
    async function uploadPhotos(files) {
      //TODO upload photos to GCS
      const storage = new Storage({
        projectId: process.env.GOOGLE_PROJECT_ID,
      });
      const photoUrls = [];
      for (const file of files) {
        const bucketName = process.env.BUCKET_NAME;
        const fileName = encodeURIComponent(file.originalname);
        const objectName = `article/${fileName}`;
        await storage.bucket(bucketName).file(objectName).save(file.buffer);
        const url = `${process.env.GOOGLE_CLOUD_STORAGE_BASE_URL}${bucketName}/${objectName}`;
        photoUrls.push(url);
      }
      return photoUrls;
    }
    const photoUrls = await uploadPhotos(req.files);
    const article = new Article({
      userId,
      placeId,
      title,
      content,
      user,
      userPhoto,
      restaurantName,
      photo: photoUrls || '',  // 設置默認值
      eatdateAt: new Date(eatdate),
      status: 'published'
    });
    
    res.status(200).json({
      message: '食記已成功建立'
    });

    try {
    await article.save();     
  } catch (error) {
    res.status(400).json({ 
      message: error.message || "Cannot create a new article",
      details: error.toString()  
    });
  }
};



exports.deleteArticle = async (req, res) => {
  
    const { id } = req.params;
    
    // 只刪除指定的文章
    await Article.findByIdAndDelete(id);
    
    res.status(200).json({
      message: '文章已成功刪除'
    });
  
};



// 新增獲取已發布文章的控制器
exports.getPublishedArticles = async (req, res) => {
    try {
      const userId = req.params.userId;  // 從 URL 參數獲取 userId
      if (!userId) {
        return res.status(400).json({ message: 'UserId is required' });
      }
  
      const articles = await Article.find({ 
        userId: userId,
        status: 'published'
      }).sort({ createdAt: -1 });
  
      res.json(articles);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };


  const handleLike = async (doc, userId) => {
    const isLiked = doc.likedBy.includes(userId);
    
    if (isLiked) {
      // 取消按讚
      doc.likedBy = doc.likedBy.filter(id => id !== userId);
      doc.likesCount = Math.max(0, doc.likesCount - 1);
    } else {
      // 添加按讚
      doc.likedBy.push(userId);
      doc.likesCount++;
    }
    
    return {
      isLiked: !isLiked,
      likesCount: doc.likesCount,
      likedBy: doc.likedBy  // 返回完整的按讚用戶列表
    };
  };

// 文章按讚
exports.toggleLike = async (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'UserId is required' });
    }

    const article = await Article.findById(id);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    const result = await handleLike(article, userId);
    await article.save();

    res.status(200).json(result);
};




exports.addComment = async (req, res) => {
  
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    // 從請求體中獲取評論資料
    const { content, userId, user, userPhoto } = req.body;
  

    // 驗證必要欄位
    if (!content || !userId || !user) {
      return res.status(400).json({ 
        message: 'Content, userId, and user are required' 
      });
    }

    // 創建新評論
    const newComment = {
      content: content.trim(),
      userId,
      user,
      userPhoto: userPhoto || '',
      createdAt: new Date(),
      likedBy: [],
      likesCount: 0,
      replies: []
    };
    // 添加評論到文章
    article.comments.push(newComment);
    article.updatedAt = new Date();
    await article.save();
    
    // 返回新創建的評論
    const createdComment = article.comments[article.comments.length - 1];
    // 返回與前端格式匹配的資料，確保包含 user 字段
    res.status(201).json({
      _id: createdComment._id,
      content: createdComment.content,
      userId: createdComment.userId,
      user: createdComment.user,
      userPhoto: createdComment.userPhoto,
      createdAt: createdComment.createdAt,
      likesCount: 0,
      isLiked: false,
      replies: []
    });

};

exports.deleteComment = async (req, res) => {
    const article = await Article.findById(req.params.articleId);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    // 使用 MongoDB 的 $pull 操作符來移除評論
    const result = await Article.findByIdAndUpdate(
      req.params.articleId,
      {
        $pull: {
          comments: { _id: req.params.commentId }
        }
      },
      { new: true }  // 返回更新後的文檔
    );

    if (!result) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    res.status(200).json({ 
      message: 'Comment deleted successfully',
      article: result
    });
};

// 評論按讚
exports.toggleCommentLike = async (req, res) => {
  
    const { articleId, commentId } = req.params;
    const { userId } = req.body;

    const article = await Article.findById(articleId);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    const comment = article.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const result = await handleLike(comment, userId);
    await article.save();

    res.status(200).json(result);
};

exports.addReply = async (req, res) => {
    const article = await Article.findById(req.params.articleId);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    const comment = article.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // 從請求中獲取回覆資料
    const { content, userId, user, userPhoto } = req.body;

    // 驗證必要欄位
    if (!content || !userId || !user) {
      return res.status(400).json({ 
        message: 'Content, userId, and user are required' 
      });
    }

    // 創建新回覆
    const newReply = {
      content: content.trim(),
      userId,
      user,
      userPhoto: userPhoto || '',
      createdAt: new Date(),
      likedBy: [],
      likesCount: 0
    };

    // 添加回覆到評論
    comment.replies.push(newReply);
    article.updatedAt = new Date();
    await article.save();
    
    // 獲取新創建的回覆
    const createdReply = comment.replies[comment.replies.length - 1];
    
    // 返回與前端格式匹配的資料
    res.status(201).json({
      _id: createdReply._id,
      content: createdReply.content,
      userId: createdReply.userId,
      user: createdReply.user,
      userPhoto: createdReply.userPhoto,
      createdAt: createdReply.createdAt,
      likesCount: 0,
      isLiked: false
    });
};

exports.deleteReply = async (req, res) => {
  
    const { articleId, commentId, replyId } = req.params;

    const article = await Article.findById(articleId);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    const comment = article.comments.find(c => c._id.toString() === commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // 找到要刪除的回覆的索引
    const replyIndex = comment.replies.findIndex(
      reply => reply._id.toString() === replyId
    );

    if (replyIndex === -1) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    // 刪除回覆
    comment.replies.splice(replyIndex, 1);
    await article.save();
    
    // 返回成功訊息
    res.status(200).json({ 
      message: '回覆已刪除'
    });
};

// 回覆按讚
exports.toggleReplyLike = async (req, res) => {
  
    const { articleId, commentId, replyId } = req.params;
    const { userId } = req.body;

    const article = await Article.findById(articleId);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    const comment = article.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const reply = comment.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    const result = await handleLike(reply, userId);
    await article.save();

    res.status(200).json(result);
};

// 獲取單篇文章
exports.getArticleById = async (req, res) => {
  
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    res.json(article);
};

// 修改已發布文章
exports.updateArticle = async (req, res) => {
    const { id } = req.params;
    const { title, content, restaurantName, placeId, photo, eatdate } = req.body;

    // 驗證必要欄位
    if (!title || !content || !eatdate) {
      return res.status(400).json({ 
        message: "Title, content and eatdate are required" 
      });
    }

    // 查找並更新文章
    const updatedArticle = await Article.findByIdAndUpdate(
      id,
      {
        title,
        content,
        restaurantName,
        placeId,
        photo,
        eatdateAt: new Date(eatdate),
        updatedAt: new Date()
      },
      { new: true }  // 返回更新後的文檔
    );

    if (!updatedArticle) {
      return res.status(404).json({ message: 'Article not found' });
    }

    res.json(updatedArticle);
};
