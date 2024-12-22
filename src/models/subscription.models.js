import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
  {
    subscriber: { //who's subscribing
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    channel: { // where's subscribing
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

export const subscription = mongoose.model("Subscription", subscriptionSchema);
