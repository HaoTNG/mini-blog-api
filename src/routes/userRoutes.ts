import express, { Request } from "express";
import { protect, restrictTo } from "../middlewares/authMiddleware";
import fs from "fs";
import path from "path";
const multer = require("multer");
const router = express.Router();
const userController = require("../controllers/userController");


const uploadDir = path.join(__dirname, "../../uploads/avatars");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}


const storage = multer.diskStorage({
  destination: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) => {
    cb(null, uploadDir);
  },
  filename: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });


router
  .route("/user/me")
  .get(protect, userController.getMe)
  .put(protect, userController.updateMe)
  .delete(protect, userController.deleteMe);

router.route("/user/check-username").get(userController.checkUsername);

router
  .route("/mod/user")
  .get(protect, restrictTo("moderator", "admin"), userController.getAllUsers);

router
  .route("/mod/user/:id")
  .delete(protect, restrictTo("admin"), userController.deleteUser);

router
  .route("/admin/:id/role")
  .patch(protect, restrictTo("admin"), userController.updateUserRole);

router.route("/user/top-contributors").get(userController.contributors);


router.post("/user/avatar/:id", upload.single("avatar"), userController.uploadAvatar);

export default router;
