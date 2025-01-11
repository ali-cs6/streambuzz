import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config()

//first congigure
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {  
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto", //file type
    });
    console.log("FileUploaded, File src: " + response.url);
    // delete from server after uplaoding
    fs.unlinkSync(localFilePath);
    return response; //could be used
  } catch (error) {
    fs.unlinkSync(localFilePath);
    return null;
  }
};

const deleteFromCloudinary = async(publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId)
    console.log("Deleted from Cloudinary", publicId);
    
  } catch (error) {
    console.log("Error deleting from Cloudinary", error);
  }
}

export { uploadOnCloudinary,  deleteFromCloudinary};
