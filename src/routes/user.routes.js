import { Router } from "express";

import { registerUser } from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";

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

export default router;
