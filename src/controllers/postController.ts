import mongoose from 'mongoose';
import Post, { IPost, topics } from '../models/postModel';
import { Request, Response } from "express";
import User, { IUser} from '../models/userModel';


exports.getAllPost = async (req: Request, res: Response) => {
    try {
        const posts: IPost[] = await Post.find().populate("author", "_id username").sort({createdAt: -1});
        res.status(200).json(posts);
    } catch (error: any) {
        res.status(400).json({ message: 'Cannot get posts', error: error.message });
    }
};


exports.getPostById = async (req: Request, res: Response) => {
    try {
        const post = await Post.findById(req.params.id).populate("author", "_id username");
        if (!post) return res.status(404).json({ message: "Post not found" });
        res.status(200).json(post);
    } catch (error) {
        res.status(500).json({ message: "server error" });
    }
};


exports.createPost = async (req: Request, res: Response) => {
    const { title, content, topic } = req.body;
    const authorId = (req as Request & { user?: IUser }).user?._id;

    if (!title || !content || !topic || !authorId) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    try {
        const newPost = await Post.create({ title, content, author: authorId, topic });
        await User.findByIdAndUpdate(authorId, {
            $push: { posts: newPost._id }
        });
        res.status(201).json(newPost);
    } catch (error: any) {
        res.status(500).json({ message: "Failed to create post", error: error.message });
    }
};

exports.updatePost = async (req: Request, res: Response) => {
    try {
        const { topic } = req.body;

        if (topic && !topics.includes(topic)) {
            return res.status(400).json({ message: "Invalid topic" });
        }

        const updatedPost = await Post.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updatedPost) {
            return res.status(404).json({ message: "Post not found" });
        }

        res.status(200).json(updatedPost);
    } catch (error: any) {
        res.status(500).json({ message: "Failed to update post", error: error.message });
    }
};


exports.deletePost = async (req: Request, res: Response) => {
    try {
        const deletedPost = await Post.findByIdAndDelete(req.params.id);

        if (!deletedPost) {
            return res.status(404).json({ message: "Post not found" });
        }

        await User.findByIdAndUpdate(deletedPost.author, { $pull: { posts: deletedPost._id } });

        res.status(200).json({ success: true, message: "Post deleted", data: deletedPost });
    } catch (error: any) {
        res.status(500).json({ message: "Failed to delete post", error: error.message });
    }
};


exports.likePost = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;
        const { id } = req.params;
        const post = await Post.findById(id) as IPost;
        if (!post) return res.status(404).json({ message: "Post not found" });

        post.dislikes = post.dislikes.filter(d => d.toString() !== userId.toString());

        if (post.likes.some(l => l.toString() === userId.toString())) {
            post.likes = post.likes.filter(l => l.toString() !== userId.toString());
        } else {
            post.likes.push(new mongoose.Types.ObjectId(userId));
        }
        await post.save();

        res.status(200).json({
            message: "like successfully",
            postId: post._id,
            likes: post.likes.length,
            dislikes: post.dislikes.length
        });
    } catch (error: any) {
        res.status(500).json({ message: "error", error: error.message });
    }
};


exports.dislikePost = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;
        const { id } = req.params;
        const post = await Post.findById(id);
        if (!post) return res.status(404).json({ message: "Post not found" });

        post.likes = post.likes.filter(l => l.toString() !== userId.toString());

        if (post.dislikes.some(d => d.toString() === userId.toString())) {
            post.dislikes = post.dislikes.filter(d => d.toString() !== userId.toString());
        } else {
            post.dislikes.push(new mongoose.Types.ObjectId(userId));
        }
        await post.save();

        res.status(200).json({
            message: "dislike successfully",
            postId: post._id,
            likes: post.likes.length,
            dislikes: post.dislikes.length
        });
    } catch (error: any) {
        res.status(500).json({ message: "error", error: error.message });
    }
};


exports.getPosts = async (req: Request, res: Response) => {
    try {
        const {
            keyword,
            author,
            minLikes,
            topic,
            page = "1",
            limit = "10",
            sortBy = "createdAt",
            sortOrder = "desc",
        } = req.query;

        const filter: any = {};

        if (keyword) {
            filter.$or = [
                { title: { $regex: keyword, $options: "i" } },
                { content: { $regex: keyword, $options: "i" } },
            ];
        }

        if (author) filter.author = author;
        if (topic) filter.topic = topic;
        if (minLikes) filter.likes = { $exists: true, $not: { $size: 0 } };

        const pageNum = parseInt(page as string) || 1;
        const limitNum = parseInt(limit as string) || 10;
        const skip = (pageNum - 1) * limitNum;

        const sortOptions: any = {};
        sortOptions[sortBy as string] = sortOrder === "asc" ? 1 : -1;

        const posts = await Post.find(filter)
            .sort(sortOptions)
            .skip(skip)
            .limit(limitNum)
            .populate("author", "username")
            .populate("likes", "_id")
            .populate("dislikes", "_id");

        const total = await Post.countDocuments(filter);

        res.json({
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
            totalPosts: total,
            posts,
        });
    } catch (error: any) {
        res.status(500).json({ message: "Server error" });
    }
};

exports.searchPosts = async (req: Request, res: Response) => {
  try {
    const keyword = (req.query.q as string)?.trim();
    if (!keyword) {
      return res.status(400).json({ message: "Missing search keyword" });
    }
    const result = await Post.find(
      { $text: { $search: keyword } },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" }, createdAt: -1 })
      .populate("author", "_id username");

    return res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to search posts",
      error: error.message
    });
  }
};


exports.deletePostByMod = async (req: Request, res: Response) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(400).json({ message: "Post not found" });

        await post.deleteOne();

        await User.findByIdAndUpdate(post.author, {$pull : {posts: post._id}});
        return res.status(200).json({ message: "Post deleted by admin" });
    } catch (error: any) {
        return res.status(400).json({ message: "Failed to delete post", error: error.message });
    }
};
