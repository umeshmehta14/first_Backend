import Mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getChannelStats = asyncHandler(async (req, res) => {
  const videos = await Video.aggregate([
    {
      $match: { owner: new Mongoose.Types.ObjectId(req.user?._id) },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "owner",
        foreignField: "channel",
        as: "totalSubscribers",
      },
    },
    {
      $addFields: {
        totalSubscribers: {
          $size: "$totalSubscribers",
        },
        likes: {
          $size: "$likes",
        },
      },
    },
    {
      $group: {
        _id: null,
        totalVideo: {
          $sum: 1,
        },
        totalSubscribers: {
          $sum: "$totalSubscribers",
        },
        totalLike: {
          $sum: "$likes",
        },
        totalViews: {
          $sum: "$views",
        },
      },
    },
    {
      $project: {
        totalVideo: 1,
        totalViews: 1,
        totalSubscribers: 1,
        totalLike: 1,
      },
    },
  ]);
  if (!videos) {
    throw new ApiError(500, "something went wrong while fetching videos");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, videos[0], "channel stats fetched successfully")
    );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const videos = await Video.aggregate([
    {
      $match: { owner: new Mongoose.Types.ObjectId(req.user?._id) },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
            },
          },
        ],
      },
    },

    {
      $addFields: {
        owner: { $first: "$owner" },
      },
    },
    {
      $project: {
        title: 1,
        thumbnail: 1,
        views: 1,
        owner: 1,
        isPublished: 1,
        createdAt: 1,
        duration: 1,
      },
    },
  ]);

  if (videos?.length === 0) {
    throw new ApiError(401, "No videos found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "All videos fetched successfully"));
});

export { getChannelVideos, getChannelStats };
