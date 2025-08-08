import { Request, Response } from "express";
import Comment from "../models/commentModel";
import Post from "../models/postModel";

exports.createComment = async (req: Request, res: Response) => {
    try{
        const {content, postId} = req.body;
        const userId = (req as any).user?._id;
        const comment = await Comment.create({
            content,
            author: userId,
            post: postId
        })
        await comment.populate('author', '_id username');
        res.status(201).json(comment);
    }catch(error: any){
        res.status(500).json({
            message: "failed to create comment",
            error: error.message
        })
    }
}

exports.getCommentsByPost = async (req: Request, res: Response) => {
    try{
        const { postId } = req.params;
        const comments = await Comment.find({post: postId}).populate('author', '_id username').sort({createdAt: -1});
        res.status(200).json(comments);
    }catch(error: any){
        res.status(500).json({
            message: "failed to get comments",
            error: error.message
        })
    }
}

exports.deleteComment = async (req: Request, res: Response) => {
    try{
        const { id } = req.params;
        const user = (req as any).user;
        const comment = await Comment.findById(id);
        if(!comment){
            return res.status(404).json({ message: "comment not found"});
        }
        
        if(comment.author.toString() !== user._id.toString() && user.role != 'moderator'){
            return res.status(403).json({ message: 'No permission to delete this comment'});
        }
        await comment.deleteOne();
        res.status(200).json({message: "comment deleted"});
    }catch(error: any){
        res.status(500).json({
            message: "failed to delete comment",
            error: error.message
        })
    }
}