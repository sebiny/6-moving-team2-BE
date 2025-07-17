import { NextFunction, Request, Response } from "express";
import { EstimateStatus, UserType } from "@prisma/client";
import { CustomError } from "../utils/customError";
import customerEstimateService from "../services/customerEstimate.service";
import { asyncHandler } from "../utils/asyncHandler";

declare global {
  namespace Express {
    interface User {
      id: string;
      userType: UserType;
    }
  }
}

// 기사님이 보낸 견적서 조회 (대기 중인 견적)
export const getEstimatesByCustomer = asyncHandler(async (req: Request, res: Response) => {
  const authUser = req.user;
  const status = req.query.status as EstimateStatus;

  if (!authUser) throw new CustomError(401, "인증된 사용자가 아닙니다.");
  if (authUser.userType !== "CUSTOMER") throw new CustomError(403, "고객만 접근 가능합니다.");
  if (!status) throw new CustomError(400, "견적 상태 쿼리 파라미터가 필요합니다.");
  if (!Object.values(EstimateStatus).includes(status)) {
    throw new CustomError(400, "유효하지 않은 견적 상태입니다.");
  }

  const estimates = await customerEstimateService.getEstimatesByCustomer(authUser.id, status);

  res.json(estimates);
});

// 대기 중인 견적 상세 조회
export const getEstimateDetail = asyncHandler(async (req: Request, res: Response) => {
  const estimateId = req.params.estimateId;
  const estimate = await customerEstimateService.getEstimateDetail(estimateId);
  res.json(estimate);
});

// 견적 확정 컨트롤러
export const acceptEstimate = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const estimateId = req.params.estimateId;

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
});

export default {
  getEstimatesByCustomer,
  getEstimateDetail,
  acceptEstimate
};
