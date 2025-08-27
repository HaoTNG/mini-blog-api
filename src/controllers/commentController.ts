import { Request, Response } from "express";
import Comment from "../models/commentModel";
import mongoose from "mongoose";
import Post from "../models/postModel";
import User from "../models/userModel";

/* ------------------------------
   Create comment (any level)
-------------------------------- */
exports.createComment = async (req: Request, res: Response) => {
  try {
    const { content, postId, parentComment } = req.body;
    const userId = (req as any).user?._id;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: "Invalid post ID" });
    }

    if (parentComment && !mongoose.Types.ObjectId.isValid(parentComment)) {
      return res.status(400).json({ message: "Invalid parent comment ID" });
    }

    const comment = await Comment.create({
      content,
      author: userId,
      post: postId,
      parentComment: parentComment || null,
    });

    await Post.findByIdAndUpdate(postId, { $push: { comments: comment._id } }, { new: true });
    await User.findByIdAndUpdate(userId, { $push: { comments: comment._id } });

    await comment.populate("author", "_id username");
    res.status(201).json(comment);
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to create comment",
      error: error.message,
    });
  }
};


exports.getCommentsByPost = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;

    const comments = await Comment.find({ post: postId })
      .populate("author", "_id username avatarUrl")
      .sort({ createdAt: 1 })
      .lean();

    const map: Record<string, any> = {};
    const roots: any[] = [];

    comments.forEach(c => {
      map[c._id.toString()] = { ...c, replies: [], depth: 0 };
    });

    comments.forEach(c => {
      const child = map[c._id.toString()];
      if (c.parentComment) {
        const parent = map[c.parentComment.toString()];
        if (!parent) return;
        child.depth = parent.depth + 1;
        if (child.depth <= 2) parent.replies.push(child); 1
      } else {
        roots.push(child);
      }
    });

    res.status(200).json(roots);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to get comments", error: error.message });
  }
};

/* ------------------------------
   Soft delete comment
-------------------------------- */
exports.setIsDelete = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (
      comment.author.toString() !== user._id.toString() &&
      user.role !== "moderator" &&
      user.role !== "admin"
    ) {
      return res.status(403).json({ message: "No permission to delete this comment" });
    }

    comment.content = "[deleted]";
    await comment.save();

    res.status(200).json({ message: "Comment marked as deleted" });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to delete comment", error: error.message });
  }
};

/* ------------------------------
   Hard delete comment + replies
-------------------------------- */
exports.deleteComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (
      comment.author.toString() !== user._id.toString() &&
      user.role !== "moderator" &&
      user.role !== "admin"
    ) {
      return res.status(403).json({ message: "No permission to delete this comment" });
    }

    await deleteCommentAndReplies(id);
    res.status(200).json({ message: "Comment and replies deleted" });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to delete comment", error: error.message });
  }
};

/* ------------------------------
   Hard delete by moderator/admin
-------------------------------- */
exports.deleteCommentByMod = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await deleteCommentAndReplies(id);
    res.status(200).json({ message: "Comment deleted by moderator/admin" });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to delete comment", error: error.message });
  }
};

/* ------------------------------
   Helper: delete a comment + all nested replies recursively
-------------------------------- */
async function deleteCommentAndReplies(commentId: string) {
  const comment = await Comment.findById(commentId);
  if (!comment) return;

  await User.findByIdAndUpdate(comment.author, { $pull: { comments: comment._id } });
  await Post.findByIdAndUpdate(comment.post, { $pull: { comments: comment._id } });

  const replies = await Comment.find({ parentComment: commentId }) as unknown as (Comment & { _id: string })[];
for (const reply of replies) {
  await deleteCommentAndReplies(reply._id);
}


  await Comment.findByIdAndDelete(commentId);
}
