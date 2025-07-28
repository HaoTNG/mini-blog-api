import { protect, restrictTo } from "../middlewares/authMiddleware";

const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');


router.route('/post').get(protect, postController.getAllPost).post(protect, postController.createPost);
router.route('/post/:id').put(protect, postController.updatePost).delete(protect, postController.deletePost);
router.route('/post/:id/like').put(protect, postController.likePost);
router.route('/post/:id/dislike').put(protect, postController.dislikePost);
router.route('/mod/:id').delete(protect, restrictTo('moderator', 'admin'), postController.deletePostByMod);
router.route('/posts').get(protect, postController.getPosts);


export default router;
