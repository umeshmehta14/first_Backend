import { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "invalid channel id");
  }

  const isChannel = await User.findById(channelId);
  if (!isChannel) {
    throw new ApiError(404, "Channel not found!");
  }

  const isSubscribed = await Subscription.findOne({
    $and: [{ channel: channelId }, { subscriber: req.user?._id }],
  });

  let toggleSubscribed;
  if (isSubscribed) {
    await Subscription.findByIdAndDelete(isSubscribed._id);
    toggleSubscribed = false;
  } else {
    await Subscription.create({
      subscriber: req.user?._id,
      channel: channelId,
    });
    toggleSubscribed = true;
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        subscribed: toggleSubscribed,
      },
      "Subscription is toggled"
    )
  );
});

export { toggleSubscription };
