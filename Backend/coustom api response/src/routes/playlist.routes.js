import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  createPlaylist,
  getPlaylistById,
  getUserPlaylists,
  deletePlaylist,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  updatePlaylist,
} from "../controllers/playlist.controller.js";

const router = new Router();

router.use(verifyJwt);

router
  .route("/:playlistId")
  .get(getPlaylistById)
  .delete(deletePlaylist)
  .patch(updatePlaylist);

router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist);
router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist);

router.route("/").post(createPlaylist);
router.route("/user/:userId").get(getUserPlaylists);

export default router;
