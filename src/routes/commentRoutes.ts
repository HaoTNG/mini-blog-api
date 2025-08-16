import express from "express";
import { protect, restrictTo } from "../middlewares/authMiddleware";
const router = express.Router();
const commentController = require("../controllers/commentController");


router.route("/comment").post( protect ,commentController.createComment);
router.route("/comment/get/:postId").get( commentController.getCommentsByPost);
router.delete("/comment/:id", protect, commentController.deleteComment);

router.delete("/mod/comment/:id", protect, restrictTo("moderator", "admin"), commentController.deleteCommentByMod)
export default router;