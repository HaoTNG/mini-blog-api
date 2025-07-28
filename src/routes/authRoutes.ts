const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.route('/auth/register').post(authController.register);
router.route('/auth/login').post(authController.login);
router.route('/auth/refresh').post(authController.refreshAccessToken);
router.route('/auth/logout').post(authController.logout);
export default router;