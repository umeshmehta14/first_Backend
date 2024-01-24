import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
  {
    videoFile: {
      type: { url: String, publicId: String }, // cloudinary video
      required: true,
    },
    thumbnail: {
      type: { url: String, publicId: String },
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    isPublished: {
      type: "boolean",
      default: true,
    },
  },
  { timestamps: true }
);

videoSchema.plugin(mongooseAggregatePaginate);
videoSchema.index({ title: "text", description: "text" });

export const Video = mongoose.model("Video", videoSchema);
