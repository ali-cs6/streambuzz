import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

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
  // console.log(avatarLocalPath);

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
    // retrieving from db, except password & token
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

const generateAccessAndRefreshToken = async (userId) => {
  try {
    //user existence check
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "user not found");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    // store refresh token
    user.refreshToken = refreshToken;
    // saving current state in DB
    await user.save({ validateBeforeSave: false }); // avoid unnecessary validation
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh tokens"
    );
  }
};

const loginUser = asyncHandler(async (req, res) => {
  //getting data
  const { email, username, password } = req.body;

  //validation
  if (!email && !password) {
    throw new ApiError(401, "Email and password is required");
  }
  //checking if user is registered
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (!user) {
    throw new Error(404, "User not found");
  }

  // validate password
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "invalid Password");
  }

  // when everything went well
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );
  // refining info for response
  const loggedInUSer = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!loggedInUSer) {
    throw new ApiError(502, "Something went wrong logging in please try again");
  }
  //response back to user with detail
  const options = {
    httpOnly: true, //cookie non-modifable by clientside
    secure: process.env.NODE_ENV === "production", // Cookie sent only over HTTPS in production
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUSer, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  //taking refreshToken from client side, req.body incase of mobile Apps mostly
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      //two possible errors
      throw new ApiError(401, "Error Decoding the Token or user not found");
    }
    //matching + refreshing token presence in db
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(
        401,
        "Invalid refresh token / refresh token is not present in DB"
      );
    }

    // validation done
    // generate new access token
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    };

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while refreshing access token"
    );
  }
});

const logOutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    //authanticated user
    req.user._id,
    //changes we want
    {
      $set: {
        refreshToken: undefined,
      },
    },
    //update user doc
    { new: true }
  );

  // response to clientside
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, "User Logged out successfully"));
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  // authanticated user via auth.middleware
  const user = await User.findById(req.user?._id);
  //check old_pass
  const isPasswordValid = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordValid) {
    throw new ApiError(401, "Old password is incorrect");
  }
  // storing new pass
  user.password = newPassword;
  // save new pass in DB
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  // authanticated user(auth_middleware) info
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user details"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  //updating destructured things only
  const { username, fullname, email } = req.body;
  //if none is present
  if (!username && !fullname && !email) {
    throw new ApiError(
      400,
      "At least one field(username, fullname, email) is required"
    );
  }

  const updatedInfo = {};
  //if any or all present, stores it in updatedInfo
  if (username) updatedInfo.username = username;
  if (fullname) updatedInfo.fullname = fullname;
  if (email) updatedInfo.email = email;

  // Update authenticated user's details
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: updatedInfo },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  // take the path of avatar
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "File is required");
  }
  // if present upload to cloud
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar.url) {
    throw new ApiError(500, "Something went wrong while uploading the avatar");
  }
  // avatar update of authanticated user
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar Updated Successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  // take the path of cover Image
  const coverLocalPath = req.file?.path;
  if (!coverLocalPath) {
    throw new ApiError(400, "File is required");
  }
  // if present upload to cloud
  const coverImage = await uploadOnCloudinary(coverLocalPath);
  if (!coverImage.url) {
    throw new ApiError(
      500,
      "Something went wrong while uploading the Cover Image"
    );
  }
  // avatar update of authanticated user
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover Image Updated Successfully"));
});

export {
  registerUser,
  loginUser,
  refreshAccessToken,
  logOutUser,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
};
