import express from "express";
import * as notificationController from "../controllers/notification.controller";
import passport from "../config/passport";
import { connectSse } from "../controllers/notification.controller";
import { cacheMiddleware } from "../middlewares/cacheMiddleware";

const notificationRouter = express.Router();

const authMiddleware = passport.authenticate("access-token", { session: false, failWithError: true });

// 실시간 알림
notificationRouter.get("/sse", authMiddleware, cacheMiddleware(300), connectSse);

// 알림 전체 조회
notificationRouter.get("/", authMiddleware, cacheMiddleware(300), notificationController.getMyNotifications);

// 특정 알림 조회
notificationRouter.get("/:id", authMiddleware, cacheMiddleware(300), notificationController.getMyNotification);

// 특정 알림 읽음 처리
notificationRouter.patch("/:id", authMiddleware, cacheMiddleware(300), notificationController.updateMyNotification);

export default notificationRouter;
