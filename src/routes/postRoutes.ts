import { protect, restrictTo } from "../middlewares/authMiddleware";

const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();
const postController = require("../controllers/postController");


const storage = multer.diskStorage({
  destination: (req: any, file: Express.Multer.File, cb: any) => {
    cb(null, path.join(__dirname, "../../uploads/posts")); 
  },
  filename: (req: any, file: Express.Multer.File, cb: any) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({ storage });


router.get("/post", postController.getAllPost);
router.get("/post/:id", postController.getPostById);
router.get("/post/user/:id", postController.getPostByUser);
router.get("/posts", postController.getPosts);
router.get("/search", postController.searchPosts);


router.post(
  "/post",
  protect,
  upload.array("images", 5),
  postController.createPost
);


router.put("/post/:id", protect, postController.updatePost);
router.put("/post/:id/like", protect, postController.likePost);
router.put("/post/:id/dislike", protect, postController.dislikePost);


router.delete("/post/:id", protect, postController.deletePost);
router.delete(
  "/mod/:id",
  protect,
  restrictTo("moderator", "admin"),
  postController.deletePostByMod
);

export default router;
