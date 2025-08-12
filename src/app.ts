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

// ★ 캐시 미들웨어 임포트
import { cacheMiddleware /*, invalidateCache*/ } from "./middlewares/cacheMiddleware"; // 파일명이 cache.ts 라고 했던 그거

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

// 인증/프로필은 GET도 개인 정보라 필요시만 켜기 (지금은 비활성)
app.use("/auth", authRouter);
app.use("/profile", profileRouter);

// 비교적 안전한 GET 다수: 캐시 적용
app.use("/address", cacheMiddleware(600), addressRouter); // ★ 주소 목록/상세: 10분
app.use("/customer", cacheMiddleware(60), estimateReqRouter); // ★ 고객측 견적 관련 GET: 1분

app.use("/reviews", reviewRouter);

// 공개 API(목록/상세 트래픽 높음): 캐시 적용
app.use("/drivers", cacheMiddleware(300), driverRouter); // ★ 드라이버 목록/상세: 5분

// 로그인된 기사용 API: 쓰기 많음 → 필요 시 라우터 내부에서 개별 GET 에만 붙여
app.use("/driver", driverPrivateRouter);

// 즐겨찾기/알림: 변화 잦음 → 짧게
app.use("/favorite", cacheMiddleware(120), favoriteRouter); // ★ 2분
app.use("/notification", cacheMiddleware(30), notificationRouter); // ★ 30초

// 고객 견적 상태 조회: 짧게
app.use("/customer/estimate", cacheMiddleware(60), customerEstimateRouter); // ★ 1분

app.use("/estimate", cacheMiddleware(120), shareEstimateRouter); // ★ 공유 링크 조회: 2분

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
