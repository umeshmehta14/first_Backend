import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(401, "Invalid video id");
  }

  if (!Number(page) || !Number(limit))
    throw new ApiError(400, "Invalid number");

  if (Number(page) < 1 || Number(limit) < 1)
    throw new ApiError(400, "Page and limit must be greater then 0");

  const skip = Number(page - 1) * Number(limit);

  const totalDocument = await Comment.aggregate([
    { $match: { video: new mongoose.Types.ObjectId(videoId) } },
    { $count: "length" },
  ]);

  const totalPage = Math.ceil(totalDocument[0]?.length / Number(limit));

  if (totalPage < Number(page))
    return res.status(200).json(new ApiResponse(200, {}, "No more comment"));

  const comments = await Comment.aggregate([
    { $match: { video: new mongoose.Types.ObjectId(videoId) } },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              avatar: 1,
              username: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: "$owner",
      },
    },
    { $skip: skip },
    { $limit: parseInt(limit) },
  ]);

  if (comments?.length === 0) {
    throw new ApiError(400, "No comments found on this video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comments, "comments fetched successfully"));
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video

  const { content } = req.body;
  const { videoId } = req.params;

  console.log(content);

  if (!isValidObjectId(videoId)) {
    throw new ApiError(401, "Invalid video id");
  }

  if (!content?.trim()) {
    throw new ApiError(400, "comment cannot be empty");
  }

  const comment = await Comment.create({
    video: videoId,
    owner: req.user?._id,
    content,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment Id");
  }

  if (!content?.trim()) {
    throw new ApiError(400, "comment cannot be empty");
  }

  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: {
        content,
      },
    },
    { new: true }
  );
  return res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "comment updated"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!isValidObjectId(commentId)) {
    throw new ApiError(401, " invalid comment Id");
  }

  const deletedComment = await Comment.findByIdAndDelete(commentId);

  if (!deletedComment) {
    throw new ApiError(401, "comment not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
