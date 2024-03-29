import Mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteFromCloudinary,
  deleteVideoFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  if (!isValidObjectId(userId)) {
    throw new ApiError(401, "Invalid user id");
  }

  if (!Number(page) || !Number(limit))
    throw new ApiError(400, "Invalid number");

  if (Number(page) < 1 || Number(limit) < 1)
    throw new ApiError(400, "Page and limit must be greater then 0");

  if (!query?.trim()) {
    throw new ApiError(400, "Invalid query");
  }

  if (!["createdAt", "views", "duration"].includes(sortBy.toString())) {
    throw new ApiError(
      400,
      "Sorted by must be one of createdAt, views, duration"
    );
  }

  if (!["asc", "desc"].includes(sortType.toString())) {
    throw new ApiError(
      400,
      "Sorted type must be one of ascending(asc) or descending(desc)"
    );
  }

  const skip = (page - 1) * limit;

  const videos = await Video.aggregate([
    {
      $match: {
        $or: [
          { title: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
        ],
      },
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
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribers",
            },
          },
          {
            $addFields: {
              subcribersCount: {
                $size: "$subscribers",
              },
              isSubscribed: {
                $cond: {
                  if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                  then: true,
                  else: false,
                },
              },
            },
          },
          {
            $project: {
              username: 1,
              avatar: 1,
              subcribersCount: 1,
              isSubscribed: 1,
              thumbnail: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
        likes: {
          $size: "$likes",
        },
      },
    },
    {
      $sort: {
        [sortBy]: sortType === "desc" ? -1 : 1,
      },
    },
    { $skip: skip },
    { $limit: parseInt(limit) },
  ]);

  if (videos?.length === 0) {
    throw new ApiError(400, "No videos found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (!(title && description)) {
    throw new ApiError(401, "title and description are required");
  }

  const videoLocalPath = req.files?.videoFile[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

  if (!videoLocalPath) {
    throw new ApiError(400, "video file is required");
  }
  if (!thumbnailLocalPath) {
    throw new ApiError(400, "thumbnail is required");
  }

  const videoFile = await uploadOnCloudinary(videoLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!videoFile) {
    throw new ApiError(400, "video file is required");
  }
  if (!thumbnail) {
    throw new ApiError(400, "thumbnail is required");
  }

  const video = await Video.create({
    title,
    description,
    thumbnail: {
      url: thumbnail.url,
      publicId: thumbnail.public_id,
    },
    videoFile: {
      url: videoFile.url,
      publicId: videoFile.public_id,
    },
    duration: videoFile.duration,
    owner: req.user?._id,
    isPublished: true,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, video, "video is uploaded successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const video = await Video.aggregate([
    {
      $match: {
        _id: new Mongoose.Types.ObjectId(videoId),
      },
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
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribers",
            },
          },
          {
            $addFields: {
              subcribersCount: {
                $size: "$subscribers",
              },
              isSubscribed: {
                $cond: {
                  if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                  then: true,
                  else: false,
                },
              },
            },
          },
          {
            $project: {
              fullname: 1,
              username: 1,
              avatar: 1,
              subcribersCount: 1,
              isSubscribed: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
        likes: {
          $size: "$likes",
        },
      },
    },
  ]);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, video, "video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const { title, description } = req.body;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video file not found");
  }

  if (title) {
    video.title = title;
  }

  if (description) {
    video.description = description;
  }

  if (req.file) {
    const thumbnailLocalPath = req.file?.path;
    if (!thumbnailLocalPath) {
      throw new ApiError(400, "thumbnail not found");
    }
    const thumbnailPublicId = video.thumbnail.publicId;

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    console.log("res", thumbnail);
    if (!thumbnail) {
      throw new ApiError(500, "something went wrong while updating thumbnail");
    } else {
      video.thumbnail.url = thumbnail.url;
      video.thumbnail.publicId = thumbnail.public_id;
    }
    await deleteFromCloudinary(thumbnailPublicId);
  }
  await video.save();

  const updatedVideo = await Video.aggregate([
    {
      $match: {
        _id: new Mongoose.Types.ObjectId(videoId),
      },
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
      $addFields: {
        likes: {
          $size: "$likes",
        },
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video Id");
  }

  const video = await Video.findById(videoId);

  if (!video) throw new ApiError(401, "video not found");

  const thumbnailPublicId = video.thumbnail.publicId;
  const videoPublicId = video.videoFile.publicId;

  const deletedFile = await Video.findByIdAndDelete(videoId);

  if (!deletedFile) throw new ApiError(401, "Video not found");

  await deleteVideoFromCloudinary(videoPublicId);
  await deleteFromCloudinary(thumbnailPublicId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video Id");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "Video not found");
  }

  video.isPublished = !video.isPublished;

  video.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, video, "updated successfully"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
