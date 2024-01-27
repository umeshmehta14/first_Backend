import mongoose, { isValidObjectId } from "mongoose";
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

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "invalid channel id");
  }

  const isChannel = await User.findById(channelId);
  if (!isChannel) {
    throw new ApiError(404, "Channel not found!");
  }

  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber",
        pipeline: [
          {
            $project: {
              username: 1,
              avatar: 1,
              _id: 1,
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribers[0]?.subscriber || [],
        "subscribers fetched successfully"
      )
    );
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "invalid subscriber id");
  }

  const channels = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channel",
        pipeline: [
          {
            $project: {
              username: 1,
              "avatar.url": 1,
              _id: 1,
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        channels[0]?.channel || [],
        "subscribed channels fetched successfully"
      )
    );
});
export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
