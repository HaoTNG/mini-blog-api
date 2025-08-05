
import mongoose, { mongo } from 'mongoose';
import Post, { IPost } from '../models/postModel';
import { Request, Response } from "express";

exports.getAllPost = async (req: Request, res: Response) => {
    try {
        const posts : IPost[] = await Post.find();
        res.status(200).json(posts);
    } catch (error: any) {
        res.status(400).json({ message: 'Cannnot get posts', error: error.message });
    }
};

exports.getPostById = async (req: Request, res: Response) =>{
  try{
    const post = await Post.findById(req.params.id).populate("author", "username");
    if(!post) return res.status(404).json({message: "Post not found"})
  }catch(error){
    res.status(500).json({message: "server error"});
  }
}

exports.createPost = async (req: Request, res: Response) => {
    const {title, content, author } = req.body;

    if(!title || !content || !author ){
        return res.status(400).json(
            {
                "success": false,
                "message": "Missing required fields: title, content, author"
            }

        );
    }

    try {
        const post = await Post.create({ title, content, author });
        res.status(201).json(post);
    }catch (error: any) {
        res.status(500).json({ message: 'Failed to create post', error: error.message });
    }

};

exports.updatePost = async (req: Request, res: Response) => {
  try {
    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true } // trả về document sau update
    );

    if (!updatedPost) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json(updatedPost);
  } catch (error: any) {
    res.status(500).json({
      message: 'Failed to update post',
      error: error.message
    });
  }
};

exports.deletePost = async (req: Request, res: Response) => {
  try {
    const deletedPost = await Post.findByIdAndDelete(req.params.id);

    if (!deletedPost) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json({
      success: true,
      message: "Post deleted",
      data: deletedPost // optional
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to delete post",
      error: error.message
    });
  }
};

exports.likePost = async (req: Request, res: Response) =>{
  try{
    const userId = (req as any).user._id;
    const { id } = req.params;
    const post = await Post.findById(id) as IPost;
    if(!post) return res.status(404).json({message:"post not found"});

    post.dislikes = post.dislikes.filter(id => id.toString()!== userId.toString());

    if(post.likes.some((id)=> id.toString()===userId.toString())){
    post.likes = post.likes.filter((id)=>id.toString() !==userId.toString())
    } else {
    post.likes.push(new mongoose.Types.ObjectId(userId));
    }
    await post.save();
    res.status(200).json({
      message:"like successfully",
      likes: post.likes.length,
      dislikes: post.dislikes.length
    })
  }catch(error: any){
    res.status(500).json({message: "error", error: error.message})
  }

}

exports.dislikePost = async (req: Request, res: Response) =>{
  try{
    const userId = (req as any).user._id;
    const {id} = req.params;
    const post = await Post.findById(id);
    if(!post) return res.status(404).json({message:"post not found"});
    post.likes = post.likes.filter((id)=> id.toString()!==userId.toString());

    if(post.dislikes.some((id)=>id.toString()===userId.toString())){
      post.dislikes = post.dislikes.filter((id)=>id.toString!==userId.toString())
    }else{
      post.dislikes.push(new mongoose.Types.ObjectId(userId));
    }
    await post.save();
    res.status(200).json({
      message: "dislike successfully",
      likes: post.likes.length,
      dislikes: post.dislikes.length
    })
  }catch(error: any){
    res.status(500).json({message:"error", error: error.message});
  }
}

//getPosts pagination
exports.getPosts = async (req: Request, res: Response) => {
  try{
    //query from url

    const {
      keyword,
      author,
      minLikes,
      minDislikes,
      page="1",
      limit = "10",
      sortBy = "createdAt",
      sortOrder = "desc",

    } = req.query;
    const filter: any = {};
    if(keyword){
      filter.$or = [
        {title: {$regex: keyword, $options: "i"} },
        {content: {$regex: keyword, $options: "i"}},
      ];
    }

    if(author){
      filter.author = author;
    }

    if(minLikes){
      filter.likes = {$exists: true, $not: {$size: 0}};
    }

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const skip = (pageNum - 1 )*limitNum;

    const sortOptions: any = {};
    sortOptions[sortBy as string] = sortOrder === "asc" ? 1 : -1;
    
    const posts = await Post.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .populate("author", "name")
      .populate("likes", "_id")
      .populate("dislikes", "_id");

    const total = await Post.countDocuments(filter);
      res.json({
        page: pageNum,
        totalPages: Math.ceil(total/limitNum),
        totalPosts: total,
        posts,
      });
  }catch(error: any){
    console.error(error);
    res.status(500).json({message: "Server error"});
  }
}


//api for moderator

exports.deletePostByMod = async (req: Request, res: Response) =>{
  try{
    const post = await Post.findById(req.params.id);
    if(!post){
      return res.status(400).json({message:"Post not found"});
    }

    await post.deleteOne();
    return res.status(200).json({message: "post deleted by admin"});
  }catch(error: any){
    return res.status(400).json({
      message: "Failed to delete post",
      error: error.message
    })
  }
}
