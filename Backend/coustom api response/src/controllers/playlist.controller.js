import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name.trim() || !description.trim()) {
    throw new ApiError(400, "Name and description is required");
  }

  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user?._id,
  });

  if (!playlist) {
    throw new ApiError(400, "error while creating playlist");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, playlist, "playlist created successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user id");
  }

  const playlists = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
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
            $project: {
              username: 1,
              "avatar.url": 1,
              _id: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
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
                    "avatar.url": 1,
                    _id: 1,
                  },
                },
              ],
            },
          },

          {
            $project: {
              "videoFile.url": 1,
              "thumbnail.url": 1,
              title: 1,
              createdAt: 1,
              views: 1,
              duration: 1,
              owner: 1,
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
      },
    },
  ]);
  if (!playlists) {
    throw new ApiError(400, "something went wrong while fetching playlists");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlists, "playlists fetched successfully"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist id");
  }

  const playlist = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
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
            $project: {
              username: 1,
              "avatar.url": 1,
              _id: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
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
                    "avatar.url": 1,
                    _id: 1,
                  },
                },
              ],
            },
          },

          {
            $project: {
              "videoFile.url": 1,
              "thumbnail.url": 1,
              title: 1,
              createdAt: 1,
              views: 1,
              duration: 1,
              owner: 1,
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
      },
    },
  ]);
  if (!playlist) {
    throw new ApiError(400, "something went wrong while fetching playlist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, playlist[0] || {}, "playlist fetched successfully")
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist id");
  }

  const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);

  if (!deletedPlaylist) {
    throw new ApiError(400, "something went wrong while deleting playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "playlist deleted successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;

  if (!name?.trim() || !description?.trim()) {
    throw new ApiError(400, "Name and description is required");
  }

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist id");
  }

  const isPlaylist = await Playlist.findById(playlistId);

  if (!isPlaylist) {
    throw new ApiError(400, "playlist not found");
  }

  isPlaylist.name = name;
  isPlaylist.description = description;

  await isPlaylist.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, isPlaylist, "playlist updated successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { videoId, playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist id");
  }
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const playlist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $addToSet: {
        videos: videoId,
      },
    },
    { new: true }
  ).populate("videos");

  if (!playlist) {
    throw new ApiError(
      400,
      "something went wrong while inserting video to playlist"
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "video inserted successfully"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { videoId, playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist id");
  }
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const playlist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: {
        videos: videoId,
      },
    },
    { new: true }
  );

  if (!playlist) {
    throw new ApiError(
      400,
      "something went wrong while deleting video from playlist"
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "video deleted successfully"));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  deletePlaylist,
  updatePlaylist,
  removeVideoFromPlaylist,
  addVideoToPlaylist,
};
