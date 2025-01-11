import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

//for cors middle-ware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

//for express middlewares
app.use(
  express.json({
    limit: "16kb",
  })
);
app.use(
  express.urlencoded({
    extended: true, //all this latest properties of urlencoded that are available
    limit: "16kb",
  })
);
app.use(express.static("public")); //allowing frontend as the whole public directory
app.use(cookieParser())

// import routes
import healthcheckRouter from "./routes/healthcheck.routes.js";
import userRouter from "./routes/user.routes.js";

// routes
app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/users", userRouter);

// error importing and shit idk man
// import { errorHandler } from "./middlewares/error,middlewares.js";
// app.use(errorHandler)

export { app };
