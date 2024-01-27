import { Router } from "express";
import { toggleSubscription } from "../controllers/subscription.controller.js";

const router = new Router();

router.route("/c/:channelId").post(toggleSubscription);
//   .get(getSubscribedChannels)

export default router;
