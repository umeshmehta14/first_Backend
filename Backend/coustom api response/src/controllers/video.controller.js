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
  //TODO: get all videos based on query, sort, pagination
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
      $addFields: {
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

export { getAllVideos, publishAVideo, getVideoById, updateVideo, deleteVideo };
