const { uploadPhotos } = require("../utils");
const Comment = require("../models/commentsModel");

//依照餐廳的placeId搜尋所有評論
const getCommentsByRestaurant = async (req, res, _next) => {
  try {
    const placeId = req.params.id;

    const restaurantComments = await Comment.find({ placeId });
    res.json(restaurantComments);
  } catch (err) {
    res.status(500).json({ message: "Cannot get comments by placeId" });
  }
};

//依照使用者userId搜尋所有評論
const getCommentsByUser = async (req, res, _next) => {
  try {
    const userId = req.params.id;
    const userComments = await Comment.find({ userId });
    res.json(userComments);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Cannot get comments by userId" });
  }
};

//新增一筆評論
const createComment = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { placeId, content, rating } = req.body;

    if (!placeId || !content || !rating) {
      res
        .status(400)
        .json({ message: "placeId, content, and rating are required" });
      return;
    }

    const photoUrls = await uploadPhotos(req.files);

    //save
    const newComment = new Comment({ ...req.body, userId, photos: photoUrls });
    const savedComment = await newComment.save();
    
    // 存入 locals 供通知使用
    res.locals.savedComment = savedComment;

    res.json(savedComment);
    next();
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: "Cannot post a new comment" });
  }
};

//更新一筆評論
const updateComment = async (req, res, _next) => {
  const commentId = req.params.id;

  try {
    const { placeId, content, rating } = req.body;

    if (!placeId || !content || !rating) {
      res
        .status(400)
        .json({ message: "placeId, content, and rating are required" });
      return;
    }

    const existing = await Comment.findById(commentId);
    if (!existing) return res.status(404).json({ message: "Comment not found" });
    if (existing.userId?.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const photoUrls = await uploadPhotos(req.files);

    const comment = await Comment.findByIdAndUpdate(
      commentId,
      {
        ...req.body,
        userId: existing.userId,
        photos: photoUrls,
        updatedAt: new Date(),
      },
      { new: true },
    );
    res.json(comment);
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: "Cannot update this comment" });
  }
};

//刪除一筆評論
const deleteComment = async (req, res, _next) => {
  const commentId = req.params.id;

  try {
    const existing = await Comment.findById(commentId);
    if (!existing) return res.status(404).json({ message: "Comment not found" });
    if (existing.userId?.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await Comment.findByIdAndUpdate(commentId, {
      isDeleted: true,
      updatedAt: new Date(),
    });
    res.json({ message: "This comment is deleted" });
  } catch (err) {
    res.status(400).json({ message: "Cannot delete this comment" });
  }
};

//更新評論讚數

const updateLikes = async (req, res, next) => {
  const { id: commentId } = req.params;
  const userId = req.user.id;

  try {
    // 查詢評論
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // 檢查用戶是否已按讚
    const hasLiked = comment.likedBy.includes(userId);

    if (hasLiked) {
      // 如果已按讚，執行取消按讚
      comment.likedBy = comment.likedBy.filter((id) => id.toString() !== userId);
      comment.likes -= 1;
    } else {
      // 如果未按讚，執行按讚
      comment.likedBy.push(userId);
      comment.likes += 1;
    }

    await comment.save();

    res.status(200).json({
      message: hasLiked ? "Like removed" : "Like added",
      likes: comment.likes,
      likedBy: comment.likedBy,
    });

    if (!hasLiked) {
      next();
    }
  } catch (error) {
    console.error("Error updating likes:", error);
    res.status(500).json({ message: "Error updating likes" });
  }
}



module.exports = {
  getCommentsByRestaurant,
  getCommentsByUser,
  createComment,
  updateComment,
  deleteComment,
  updateLikes,
};
