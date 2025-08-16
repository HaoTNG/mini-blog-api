import { protect, restrictTo } from "../middlewares/authMiddleware";

const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");



router.route("/user/me").get(protect, userController.getMe).put(protect, userController.updateMe).delete(protect, userController.deleteMe);

router.route("/mod/user").get(protect, restrictTo('moderator', 'admin'), userController.getAllUsers);
router.route("/mod/user/:id").delete(protect, restrictTo( 'admin'), userController.deleteUser);
router.route("/admin/:id/role").patch(protect, restrictTo("admin"), userController.updateUserRole);
router.route("/user/top-contributors").get(userController.contributors);
export default router;