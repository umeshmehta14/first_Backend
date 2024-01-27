import { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const isLiked = await Like.findOne({
    $and: [{ video: videoId }, { likedBy: req.user?._id }],
  });

  if (isLiked) {
    await Like.findOneAndDelete({
      $and: [{ video: videoId }, { likedBy: req.user?._id }],
    });
    res
      .status(200)
      .json(new ApiResponse(200, { isLiked: false }, "Unlike the video"));
  } else {
    await Like.create({
      likedBy: req.user?._id,
      video: videoId,
    });
    res
      .status(201)
      .json(new ApiResponse(201, { isLiked: true }, "Liked the video"));
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment id");
  }

  const isLiked = await Like.findOne({
    $and: [{ comment: commentId }, { likedBy: req.user?._id }],
  });

  if (isLiked) {
    await Like.findOneAndDelete({
      $and: [{ comment: commentId }, { likedBy: req.user?._id }],
    });
    res
      .status(200)
      .json(new ApiResponse(200, { isLiked: false }, "Unlike the comment"));
  } else {
    await Like.create({
      likedBy: req.user?._id,
      comment: commentId,
    });
    res
      .status(201)
      .json(new ApiResponse(201, { isLiked: true }, "Liked the comment"));
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet id");
  }

  const isLiked = await Like.findOne({
    $and: [{ tweet: tweetId }, { likedBy: req.user?._id }],
  });

  if (isLiked) {
    await Like.findOneAndDelete({
      $and: [{ tweet: tweetId }, { likedBy: req.user?._id }],
    });
    res
      .status(200)
      .json(new ApiResponse(200, { isLiked: false }, "Unlike the tweet"));
  } else {
    await Like.create({
      likedBy: req.user?._id,
      tweet: tweetId,
    });
    res
      .status(201)
      .json(new ApiResponse(201, { isLiked: true }, "Liked the tweet"));
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const likedVideos = await Like.find({
    likedBy: req.user?._id,
    video: { $ne: null },
  }).populate("video");

  if (!likedVideos) {
    throw new ApiError(400, "something went wrong while fetching liked videos");
  }

  res
    .status(200)
    .json(new ApiResponse(200, likedVideos, "Fetched all liked video"));
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
