import { Router } from "express";
import { registerUser, logOutUser, loginUser, refreshAccessToken, getCurrentUser, getUserChannelProfile, updateAccountDetails, updateUserAvatar, getWatchHistory } from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";
import {verifyJWT} from "../middlewares/auth.middlewares.js";

const router = Router();


//unsecured routes

// post req coz we are recieving data
// multer for input files
router.route("/register").post(
  upload.fields([ // multiple files
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser)
router.route("/refresh-token").post(refreshAccessToken)

//secured routes
router.route("/logout").post(verifyJWT, logOutUser)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/c/:usernme").get(verifyJWT, getUserChannelProfile)
router.route("/updte-account").patch(verifyJWT, updateAccountDetails)
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserAvatar)
router.route("/history").get(verifyJWT, getWatchHistory)

export default router;