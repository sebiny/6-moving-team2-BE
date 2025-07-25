import reviewRepository from "../repositories/review.repository";
import { CreateReviewInput } from "../types/review.type";
import { CustomError } from "../utils/customError";

//작성 가능한 견적(리뷰)
async function getAllCompleted(customerId: string) {
  return reviewRepository.findAllCompletedEstimateRequest(customerId);
}

//리뷰 작성
async function createReview(data: CreateReviewInput) {
  const { customerId, estimateRequestId } = data;

  const existingReview = await reviewRepository.findByCustomerAndEstimate(customerId, estimateRequestId);

  if (existingReview) {
    throw new CustomError(400, "이미 이 견적에 대한 리뷰가 작성되었습니다.");
  }

  return await reviewRepository.createReview(data);
}

//내가 쓴 리뷰
async function getMyReviews(customerId: string) {
  return reviewRepository.getMyReviews(customerId);
}
export default { getAllCompleted, createReview, getMyReviews };
