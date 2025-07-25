import { Request, Response } from "express";
import reviewService from "../services/review.service";
import { asyncHandler } from "../utils/asyncHandler";
import { CustomError } from "../utils/customError";

// 작성 가능한 견적(리뷰)
const getAllCompletedEstimate = asyncHandler(async (req: Request, res: Response) => {
  const customerId = req.user?.customerId;
  console.log(customerId);
  if (!customerId) throw new CustomError(400, "고객 정보를 확인할 수 없습니다.");

  const estimates = await reviewService.getAllCompleted(customerId);
  if (!estimates || estimates.length === 0) {
    throw new CustomError(404, "작성 가능한 리뷰가 없습니다.");
  }
  res.status(200).json(estimates);
});

// 리뷰 작성하기
const createReview = asyncHandler(async (req: Request, res: Response) => {
  const customerId = req.user?.customerId;
  if (!customerId) throw new CustomError(400, "고객 정보를 확인할 수 없습니다.");

  const { content, rating, driverId, estimateRequestId } = req.body;

  if (!content || !rating || !driverId || !estimateRequestId) {
    throw new CustomError(400, "리뷰에 필요한 정보가 누락되었습니다.");
  }

  const review = await reviewService.createReview({
    customerId,
    content,
    rating,
    driverId,
    estimateRequestId
  });

  return res.status(201).json({ message: "리뷰 작성 완료", review });
});

// 내가 쓴 리뷰 가져오기
const getMyReviews = asyncHandler(async (req: Request, res: Response) => {
  const customerId = req.user?.customerId;
  if (!customerId) throw new CustomError(400, "고객 정보를 확인할 수 없습니다.");

  const reviews = await reviewService.getMyReviews(customerId);
  if (!reviews || reviews.length === 0) {
    throw new CustomError(404, "작성한 리뷰가 없습니다.");
  }

  res.status(200).json(reviews);
});

export default {
  getAllCompletedEstimate,
  createReview,
  getMyReviews
};
