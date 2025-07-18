import express from "express";
import passport from "../config/passport";
import * as customerEstimateController from "../controllers/customerEstimate.controller";

const customerEstimateRouter = express.Router();

// JWT 인증 미들웨어
const authMiddleware = passport.authenticate("access-token", {
  session: false,
  failWithError: true
});

// 대기중인 견적서 조회
customerEstimateRouter.get("/pending", authMiddleware, customerEstimateController.getPendingEstimates);

// 받았던 견적 리스트 조회
customerEstimateRouter.get("/approve", authMiddleware, customerEstimateController.getReceivedEstimates);

// 견적 확정하기
customerEstimateRouter.patch("/:estimateId/accept", authMiddleware, customerEstimateController.acceptEstimate);

// 대기중인 견적서 상세 조회 & 받았던 견적서 상세 조회
customerEstimateRouter.get("/:estimateId", authMiddleware, customerEstimateController.getEstimateDetail);

export default customerEstimateRouter;
