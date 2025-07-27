import express from "express";
import { protect } from "../middlewares/authMiddleware";
const router = express.Router();
const commentController = require("../controllers/commentController");


router.route("/comment").post( protect ,commentController.createComment);
router.route("/comment/get").get(protect, commentController.getCommentsByPost);
router.delete("/comment/:id", protect, commentController.deleteComment);

export default router;