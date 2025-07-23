import { NextFunction, Request, Response } from "express";
import { UserType } from "@prisma/client";
import { CustomError } from "../utils/customError";
import customerEstimateService from "../services/customerEstimate.service";
import { asyncHandler } from "../utils/asyncHandler";
import notificationService from "../services/notification.service";

declare global {
  namespace Express {
    interface User {
      id: string;
      userType: UserType;
    }
  }
}

// 대기 중인 견적 리스트 조회
export const getPendingEstimates = asyncHandler(async (req: Request, res: Response) => {
  const authUser = req.user;

  if (!authUser) throw new CustomError(401, "인증된 사용자가 아닙니다.");
  if (authUser.userType !== "CUSTOMER") throw new CustomError(403, "고객만 접근 가능합니다.");

  const estimates = await customerEstimateService.getPendingEstimates(authUser.id);

  res.json(estimates);
});

// 받았던 견적 리스트 조회
export const getReceivedEstimates = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authUser = req.user;
    if (!authUser) throw new CustomError(401, "인증된 사용자가 아닙니다.");
    if (authUser.userType !== "CUSTOMER") throw new CustomError(403, "고객만 접근 가능합니다.");

    const data = await customerEstimateService.getReceivedEstimates(authUser.id);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
});

// 견적 확정
export const acceptEstimate = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const estimateId = req.params.estimateId;
  try {
    const result = await customerEstimateService.acceptEstimate(estimateId);

    res.status(200).json({
      message: "견적이 성공적으로 확정되었습니다.",
      data: result
    });
  } catch (error) {
    if (error instanceof CustomError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error); // 예기치 못한 에러는 전역 에러 핸들러로
  }

  // 알림 전송
  try {
    const estimate = await customerEstimateService.getCustomerAndDriverIdbyEstimateId(estimateId);
    const driverId = estimate.driverId;
    const customerId = estimate.estimateRequest.customerId;
    await notificationService.createEstimateConfirmNotification({ driverId, customerId, estimateId });
  } catch (error) {
    if (error instanceof CustomError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error); // 예기치 못한 에러는 전역 에러 핸들러로
  }
});

// 대기 중인 & 받았던 견적 상세 조회
export const getEstimateDetail = asyncHandler(async (req: Request, res: Response) => {
  const estimateId = req.params.estimateId;
  const estimate = await customerEstimateService.getEstimateDetail(estimateId);
  res.json(estimate);
});

export default {
  getEstimateDetail,
  acceptEstimate,
  getReceivedEstimates,
  getPendingEstimates
};
