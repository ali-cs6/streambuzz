import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    throw new ApiError(400, "Please fill input Fields");
  }

  const { fullname, email, username, password } = req.body;

  //validation

  // checking for empty fields
  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All Fields are Required");
  }

  // if user already exist
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User with email or username already exist");
  }

  // handling file uploads
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar File is missing");
  }
  console.log(avatarLocalPath);
  

  // // if uploaded, uplaod to cloudinary
  // const avatar = await uploadOnCloudinary(avatarLocalPath);
  // // coverImage not compulsary
  // let coverImage = "";
  // if (coverLocalPath) {
  //   coverImage = await uploadOnCloudinary(coverLocalPath);
  // }

  // uploading avatar to cloudinary
  let avatar;
  try {
    avatar = await uploadOnCloudinary(avatarLocalPath);
    console.log("Uploaded avatar to Cloudinary", avatar);
  } catch (error) {
    console.log("Error Uploading Avatar", error);
    throw new ApiError(500, "Failed Upload Avatar");
  }

  // uploading coverImage to cloudinary
  let coverImage;
  try {
    coverImage = await uploadOnCloudinary(coverLocalPath);
    console.log("Uploaded coverImage to Cloudinary", coverImage);
  } catch (error) {
    console.log("Error Uploading coverImage", error);
    throw new ApiError(500, "Failed Upload CoverImage");
  }

  // DB work
  try {
    // create new user in DB according to taken data
    const user = await User.create({
      fullname,
      email,
      username: username.toLowerCase(),
      password,
      avatar: avatar.url, // from cloudinary
      coverImage: coverImage?.url || "",
    });

    // checking if registered correctly
    // retrieving from db, except pass, token
    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );
    if (!createdUser) {
      throw new ApiError(500, "Something went wrong while registering a user");
    }

    return res
      .status(201)
      .json(new ApiResponse(201, createdUser, "User registered successfully"));
  } catch (error) {
    console.log("User Creation Failed", error);
    // removing from cloudinary, upon filing
    if (avatar) {
      await deleteFromCloudinary(avatar.public_id);
    }
    if (coverImage) {
      await deleteFromCloudinary(coverImage.public_id);
    }

    throw new ApiError(
      500,
      "Something wentWrong while registering the user and images were deleted from cloudinary"
    );
  }
});

export { registerUser };
