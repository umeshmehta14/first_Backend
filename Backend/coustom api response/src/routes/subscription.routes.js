import { Router } from "express";
import {
  getUserChannelSubscribers,
  toggleSubscription,
  getSubscribedChannels,
} from "../controllers/subscription.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = new Router();

router.use(verifyJwt);

router
  .route("/c/:channelId")
  .post(toggleSubscription)
  .get(getUserChannelSubscribers);

router.route("/u/:subscriberId").get(getSubscribedChannels);

export default router;
