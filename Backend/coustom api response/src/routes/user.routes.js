import { Router } from "express";
import {
  changeCurrentPassword,
  getCurrentUser,
  getUserProfile,
  getWatchHistory,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateAccountDetails,
  updateAvatar,
  updateCoverImage,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

//secured routes
router.route("/logout").post(verifyJwt, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJwt, changeCurrentPassword);
router.route("/current-user").get(verifyJwt, getCurrentUser);
router.route("/update-details").patch(verifyJwt, updateAccountDetails);

router
  .route("/update-avatar")
  .post(verifyJwt, upload.single("avatar"), updateAvatar);
router
  .route("/update-coverImage")
  .post(verifyJwt, upload.single("coverImage"), updateCoverImage);

router.route("/channel/:username").get(verifyJwt, getUserProfile);
router.route("/watch-history").get(verifyJwt, getWatchHistory);

export default router;
