import express from "express";
import passport from "../config/passport";
import * as customerEstimateController from "../controllers/customerEstimate.controller";
import { cacheMiddleware } from "../middlewares/cacheMiddleware";

const customerEstimateRouter = express.Router();

// 커스텀 인증 미들웨어: 실패 시 401 JSON 바로 반환
const auth = (req: any, res: any, next: any) => {
  passport.authenticate("access-token", { session: false }, (err: any, user: any) => {
    if (err || !user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    req.user = user;
    next();
  })(req, res, next);
};

// 대기중인 견적서 조회
customerEstimateRouter.get("/pending", auth, cacheMiddleware(300), customerEstimateController.getPendingEstimates);

// 받았던 견적 리스트 조회
customerEstimateRouter.get("/approve", auth, cacheMiddleware(300), customerEstimateController.getReceivedEstimates);

// 견적 확정하기
customerEstimateRouter.patch("/:estimateId/accept", auth, customerEstimateController.acceptEstimate);

// 견적 상세 조회
customerEstimateRouter.get("/:estimateId", auth, cacheMiddleware(300), customerEstimateController.getEstimateDetail);

export default customerEstimateRouter;
