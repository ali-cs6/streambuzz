import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}`)

    console.log(`\nmongoDB connected! DB host: ${connectionInstance.connection.host}/${DB_NAME}`);
    

  } catch (error) {
    console.log("MongoDB connection error", error);
    process.exit(1)
  }
}


export default connectDB