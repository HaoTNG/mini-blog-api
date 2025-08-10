import { protect, restrictTo } from "../middlewares/authMiddleware";

const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');


router.get("/post", postController.getAllPost);
router.get("/post/:id", postController.getPostById);
router.post("/post", protect, postController.createPost);
router.put("/post/:id", protect, postController.updatePost);
router.delete("/post/:id", protect, postController.deletePost);
router.put("/post/:id/like", protect, postController.likePost);
router.put("/post/:id/dislike", protect, postController.dislikePost);
router.delete(
  "/mod/:id",
  protect,
  restrictTo("moderator", "admin"),
  postController.deletePostByMod
);
router.get("/posts", postController.getPosts); // pagination


export default router;
