import express from "express";
import { EstimateCompletionScheduler } from "../utils/estimateCompletionScheduler";
import { asyncHandler } from "../utils/asyncHandler";

const adminRouter = express.Router();

// 스케줄러 상태 확인
adminRouter.get(
  "/scheduler/status",
  asyncHandler(async (req, res) => {
    const status = EstimateCompletionScheduler.getStatus();
    res.status(200).json(status);
  })
);

// 스케줄러 수동 실행
adminRouter.post(
  "/scheduler/run",
  asyncHandler(async (req, res) => {
    await EstimateCompletionScheduler.runManually();
    res.status(200).json({ message: "스케줄러가 수동으로 실행되었습니다." });
  })
);

export default adminRouter;
