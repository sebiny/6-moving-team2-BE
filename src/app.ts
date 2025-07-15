import express from "express";
import cookieParser from "cookie-parser";
import passport from "./config/passport";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import yaml from "yaml";
import path from "path";
import authRouter from "./routes/auth.router";
import profileRouter from "./routes/profile.router";
import driverRouter from "./routes/driver.router";
import favoriteRouter from "./routes/favorite.router";
import estimateReqRouter from "./routes/estimateReq.router";
import reviewRouter from "./routes/review.router";
import { errorHandler } from "./middlewares/errorHandler";

const app = express();
app.use(
  cors({
    origin: ["http://localhost:3000", "https://6-moving-team2-fe-sepia.vercel.app"],
    credentials: true
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.use("/auth", authRouter);
app.use("/profile", profileRouter);
app.use("/", estimateReqRouter);
app.use("/", reviewRouter);

app.use("/drivers", driverRouter);

app.use("/favorite", favoriteRouter);

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(yaml.parse(fs.readFileSync(path.join(path.resolve(), "openapi.yaml"), "utf-8")))
);

app.use(errorHandler as express.ErrorRequestHandler);

export default app;
