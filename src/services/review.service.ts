import driverRepository from "../repositories/driver.repository";
import reviewRepository from "../repositories/review.repository";
import { CreateReviewInput } from "../types/review.type";
import { CustomError } from "../utils/customError";

//작성 가능한 견적(리뷰)
async function getAllCompleted(customerId: string, page: number) {
  return reviewRepository.findAllCompletedEstimateRequest(customerId, page);
}

//내가 쓴 리뷰
async function getMyReviews(customerId: string, page: number) {
  return reviewRepository.getMyReviews(customerId, page);
}

//리뷰 작성
async function createReview(data: CreateReviewInput) {
  const { customerId, estimateRequestId, driverId, rating } = data;

  const existingReview = await reviewRepository.findByCustomerAndEstimate(customerId, estimateRequestId);

  if (existingReview) {
    throw new CustomError(400, "이미 이 견적에 대한 리뷰가 작성되었습니다.");
  }
  const review = await reviewRepository.createReview(data);

  // 리뷰 생성 후 기사님 평균 평점 계산
  const allReviews = await reviewRepository.findAllByDriver(driverId);
  const total = allReviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating =
    allReviews.length > 0 ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length : 0;
  await driverRepository.updateAverageRating(driverId, averageRating);

  return review;
}

export default { getAllCompleted, createReview, getMyReviews };
