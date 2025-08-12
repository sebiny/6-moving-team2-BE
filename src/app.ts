import express from "express";
import cookieParser from "cookie-parser";
import passport from "./config/passport";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import * as Sentry from "@sentry/node";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import yaml from "yaml";
import path from "path";
import authRouter from "./routes/auth.router";
import profileRouter from "./routes/profile.router";
import driverRouter from "./routes/driver.router";
import favoriteRouter from "./routes/favorite.router";
import addressRouter from "./routes/address.router";
import estimateReqRouter from "./routes/estimateReq.router";
import reviewRouter from "./routes/review.router";
import { errorHandler } from "./middlewares/errorHandler";
import notificationRouter from "./routes/notification.router";
import customerEstimateRouter from "./routes/customerEstimate.router";
import driverPrivateRouter from "./routes/driverPrivate.router";
import shareEstimateRouter from "./routes/shareEstimate.router";
import { initializeCronJobs } from "./utils/cronScheduler";

// 캐시 미들웨어 임포트
import { cacheMiddleware } from "./middlewares/cacheMiddleware";

const app = express();
app.use(helmet());
app.use(morgan("combined"));
app.use(
  cors({
    origin: ["http://localhost:3000", "https://6-moving-team2-fe-sepia.vercel.app", "https://www.moving-2.click"],
    credentials: true
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.get("/health", (req, res) => {
  res.send("Health Check Success");
});

app.use("/auth", authRouter);
app.use("/profile", profileRouter);
app.use("/address", cacheMiddleware(600), addressRouter);
app.use("/customer", cacheMiddleware(600), estimateReqRouter);

app.use("/reviews", reviewRouter);
app.use("/drivers", cacheMiddleware(600), driverRouter);
app.use("/driver", driverPrivateRouter);

app.use("/favorite", cacheMiddleware(600), favoriteRouter);
app.use("/notification", cacheMiddleware(600), notificationRouter);

app.use("/customer/estimate", cacheMiddleware(600), customerEstimateRouter);
app.use("/estimate", cacheMiddleware(600), shareEstimateRouter);

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(yaml.parse(fs.readFileSync(path.join(path.resolve(), "openapi.yaml"), "utf-8")))
);

// Cron 작업 초기화
initializeCronJobs();

Sentry.setupExpressErrorHandler(app);
app.use(errorHandler as express.ErrorRequestHandler);

export default app;
