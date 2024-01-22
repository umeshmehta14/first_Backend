import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
  {
    channel: {
      // one to whom subscriber is subscibing
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    subsciber: {
      // one who is subscribing
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
