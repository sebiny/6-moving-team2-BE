import express from "express";
import passport from "../config/passport";
import * as customerEstimateController from "../controllers/customerEstimate.controller";

const customerEstimateRouter = express.Router();

// JWT 인증 미들웨어
const authMiddleware = passport.authenticate("access-token", {
  session: false,
  failWithError: true
});

// 기사님이 보낸 견적서 조회 (대기 중인 견적)
customerEstimateRouter.get("/", authMiddleware, customerEstimateController.getEstimatesByCustomer);

// 견적서 상세 조회
customerEstimateRouter.get("/:estimateId", authMiddleware, customerEstimateController.getEstimateDetail);

// 견적 확정하기
customerEstimateRouter.patch("/:estimateId/accept", authMiddleware, customerEstimateController.acceptEstimate);

export default customerEstimateRouter;
