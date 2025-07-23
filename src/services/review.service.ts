import reviewRepository from "../repositories/review.repository";
import { CreateReviewInput } from "../types/review.type";

//작성 가능한 견적(리뷰)
async function getAllCompleted(customerId: string) {
  return reviewRepository.findAllCompletedEstimateRequest(customerId);
}

//리뷰 작성
async function createReview(data: CreateReviewInput) {
  const createReview = await reviewRepository.createReview(data);

  return createReview;
}

//내가 쓴 리뷰
async function getMyReviews(customerId: string) {
  return reviewRepository.getMyReviews(customerId);
}
export default { getAllCompleted, createReview, getMyReviews };
