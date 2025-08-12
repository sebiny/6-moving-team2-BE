import express from "express";
import passport from "../config/passport";
import * as shareEstimateController from "../controllers/shareEstimate.controller";
import { cacheMiddleware } from "../middlewares/cacheMiddleware";

const router = express.Router();

// JWT 인증 (공유 링크 생성은 로그인 필요)
const authMiddleware = passport.authenticate("access-token", {
  session: false,
  failWithError: true
});

// 공유 링크 생성
router.post("/:estimateId/share", authMiddleware, shareEstimateController.createShareLink);

// 공유 링크 접근 (비회원 허용)
router.get("/shared/:token", cacheMiddleware(300), shareEstimateController.getSharedEstimate);

export default router;
