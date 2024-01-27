import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { createPlaylist } from "../controllers/playlist.controller.js";

const router = new Router();

router.use(verifyJwt);

router.route("/").post(createPlaylist);

export default router;
