import mongoose, { Schema } from "mongoose";

const LikeSchema = Schema(
  {
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
      count: 0,
    },
    comment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      count: 0,
    },
    tweet: {
      type: Schema.Types.ObjectId,
      ref: "Tweet",
    },
    likedby: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Like = mongoose.model("Like", LikeSchema);
