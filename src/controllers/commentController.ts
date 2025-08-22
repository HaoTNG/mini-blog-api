import { Request, Response } from "express";
import Comment from "../models/commentModel";
import mongoose from "mongoose";
import Post from "../models/postModel";
import User from "../models/userModel"
// Create comment (support nested)
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
            parentComment: parentComment || null
        });

        
        await Post.findByIdAndUpdate(
            postId,
            { $push: { comments: comment._id } },
            { new: true }
        );
        await User.findByIdAndUpdate(userId, { $push: { comments: comment._id } });

        await comment.populate("author", "_id username");
        res.status(201).json(comment);
    } catch (error: any) {
        res.status(500).json({
            message: "Failed to create comment",
            error: error.message
        });
    }
};


// Get all comments for a post (nested)
exports.getCommentsByPost = async (req: Request, res: Response) => {
    try {
        const { postId } = req.params;

        const comments = await Comment.find({ post: postId })
            .populate("author", "_id username")
            .sort({ createdAt: 1 }) // oldest first for nesting
            .lean();

        // Build nested tree
        const map: Record<string, any> = {};
        const roots: any[] = [];

        comments.forEach(c => {
            map[c._id.toString()] = { ...c, replies: [] };
        });

        comments.forEach(c => {
            if (c.parentComment) {
                map[c.parentComment.toString()]?.replies.push(map[c._id.toString()]);
            } else {
                roots.push(map[c._id.toString()]);
            }
        });

        res.status(200).json(roots);
    } catch (error: any) {
        res.status(500).json({
            message: "Failed to get comments",
            error: error.message
        });
    }
};

// Delete comment (and optionally replies)
exports.deleteComment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = (req as any).user;

        const comment = await Comment.findById(id);
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        if (
            comment.author.toString() !== user._id.toString() &&
            user.role !== "moderator" &&
            user.role !== "admin"
        ) {
            return res.status(403).json({ message: "No permission to delete this comment" });
        }


        await User.findByIdAndUpdate(comment.author, { $pull: { comments: comment._id } });
        // Option: delete all replies recursively
        await deleteCommentWithReplies(id);

        res.status(200).json({ message: "Comment and its replies deleted" });
    } catch (error: any) {
        res.status(500).json({
            message: "Failed to delete comment",
            error: error.message
        });
    }
};

// Helper: delete comment and all its replies
async function deleteCommentWithReplies(commentId: string) {
    const comment = await Comment.findById(commentId);
    if (!comment) return;

    await User.findByIdAndUpdate(comment.author, { $pull: { comments: comment._id } });


    const replies = await Comment.find({ parentComment: commentId });
    for (const reply of replies) {
        await deleteCommentWithReplies((reply as any)._id.toString());
    }

    await Comment.findByIdAndDelete(commentId);
}

// Moderator/Admin delete (also handles replies)
exports.deleteCommentByMod = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await deleteCommentWithReplies(id);
        res.status(200).json({ message: "Comment deleted by moderator/admin" });
    } catch (error: any) {
        res.status(500).json({ message: "Failed to delete comment", error: error.message });
    }
};
