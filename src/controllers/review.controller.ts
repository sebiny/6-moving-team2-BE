import { Request, Response } from "express";
import reviewService from "../services/review.service";
import { asyncHandler } from "../utils/asyncHandler";
import { CustomError } from "../utils/customError";

// 작성 가능한 견적(리뷰)
const getAllCompletedEstimate = asyncHandler(async (req: Request, res: Response) => {
  const customerId = req.user?.customerId;
  const page = Number(req.query.page) || 1;
  if (!customerId) throw new CustomError(400, "고객 정보를 확인할 수 없습니다.");

  const result = await reviewService.getAllCompleted(customerId, Number(page));

  if (!result.reviewableEstimates || result.reviewableEstimates.length === 0) {
    throw new CustomError(404, "작성 가능한 리뷰가 없습니다.");
  }

  res.status(200).json(result);
});

// 내가 쓴 리뷰 가져오기
const getMyReviews = asyncHandler(async (req: Request, res: Response) => {
  const customerId = req.user?.customerId;
  const page = Number(req.query.page) || 1;
  if (!customerId) throw new CustomError(400, "고객 정보를 확인할 수 없습니다.");

  const result = await reviewService.getMyReviews(customerId, Number(page));
  if (!result.reviews || result.reviews.length === 0) {
    throw new CustomError(404, "작성한 리뷰가 없습니다.");
  }

  res.status(200).json(result); // result는 { reviews, totalCount, totalPages }
});

// 리뷰 작성하기
const createReview = asyncHandler(async (req: Request, res: Response) => {
  const customerId = req.user?.customerId;
  if (!customerId) throw new CustomError(400, "고객 정보를 확인할 수 없습니다.");

  const { content, rating, driverId, estimateRequestId } = req.body;

  if (!content || !rating || !driverId || !estimateRequestId) {
    throw new CustomError(400, "리뷰에 필요한 정보가 누락되었습니다.");
  }
  try {
    const review = await reviewService.createReview({
      customerId,
      content,
      rating,
      driverId,
      estimateRequestId
    });
    return res.status(201).json({ message: "리뷰 작성 완료", review });
  } catch (error: any) {
    console.error("리뷰 생성 중 에러:", error.message, error);
    throw new CustomError(500, "리뷰 작성 실패 (서버 내부 오류)");
  }
});

export default {
  getAllCompletedEstimate,
  createReview,
  getMyReviews
};
