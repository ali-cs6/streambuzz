import { Router } from "express";
import { registerUser, logOutUser } from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";
import {verifyJWT} from "../middlewares/auth.middlewares.js";

const router = Router();

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

//secured routes
router.route("/logout").post(verifyJWT, logOutUser)

export default router;
