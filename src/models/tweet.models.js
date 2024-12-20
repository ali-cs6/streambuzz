import mongoose, { Schema } from "mongoose";

const tweetSchema = Schema({
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  content: {
    type: String,
    required: true,
  },
}, { timestamp: true })

export const Tweet = mongoose.model("Tweet", tweetSchema);
