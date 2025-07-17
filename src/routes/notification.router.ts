import express from "express";
import * as notificationController from "../controllers/notification.controller";
import passport from "../config/passport";
import { connectSse } from "../controllers/notification.controller";

const notificationRouter = express.Router();

const authMiddleware = passport.authenticate("access-token", { session: false, failWithError: true });

// 알림 전체 조회
notificationRouter.get("/", authMiddleware, notificationController.getAllNotifications);

// 특정 알림 조회

// 알림 전체 읽음 처리

// 특정 알림 읽음 처리

// 특정 알림 삭제 처리

notificationRouter.get("/sse", authMiddleware, connectSse);

export default notificationRouter;
