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
import addressRouter from "./routes/address.router";
import estimateReqRouter from "./routes/estimateReq.router";
import reviewRouter from "./routes/review.router";
import { errorHandler } from "./middlewares/errorHandler";
import notificationRouter from "./routes/notification.router";
import customerEstimateRouter from "./routes/customerEstimate.router";
import driverPrivateRouter from "./routes/driverPrivate.router";
import adminRouter from "./routes/admin.router";
import cron from "node-cron";
import { sendMoveDayReminders } from "./utils/moveReminder";

const app = express();
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
app.use("/address", addressRouter);
app.use("/customer", estimateReqRouter);
app.use("/reviews", reviewRouter);

app.use("/drivers", driverRouter); // 공개 API
app.use("/driver", driverPrivateRouter); // 로그인된 기사용 API

app.use("/favorite", favoriteRouter);
app.use("/notification", notificationRouter);

app.use("/customer/estimate", customerEstimateRouter);

app.use("/admin", adminRouter);

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(yaml.parse(fs.readFileSync(path.join(path.resolve(), "openapi.yaml"), "utf-8")))
);

// 00:00:00 - 당일 이사 중 ACCEPTED인 Estimate 수집
cron.schedule("0 0 * * *", sendMoveDayReminders, {
  timezone: "Asia/Seoul" // 시간대(Timezone)를 명시하는 것이 좋습니다.
});

app.use(errorHandler as express.ErrorRequestHandler);

export default app;
