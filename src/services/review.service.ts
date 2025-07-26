import driverRepository from "../repositories/driver.repository";
import reviewRepository from "../repositories/review.repository";
import { CreateReviewInput, ReviewInput } from "../types/review.type";
import { CustomError } from "../utils/customError";

//작성 가능한 견적(리뷰)
async function getAllCompleted(customerId: string) {
  return reviewRepository.findAllCompletedEstimateRequest(customerId);
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
  const total = allReviews.reduce((sum, r) => sum + r.rating, 0) + rating;
  const averageRating = total / (allReviews.length + 1);
  console.log(total, averageRating);
  await driverRepository.updateAverageRating(driverId, averageRating);

  return review;
}

async function deleteReview(reviewId: string, customerId: string) {
  const targetReview = await reviewRepository.findReviewById(reviewId, customerId);

  if (!targetReview) {
    throw new CustomError(404, "리뷰를 찾을 수 없습니다.");
  }

  // 삭제 전에 driverId 확보
  const driverId = targetReview.driverId;

  // 리뷰 삭제
  await reviewRepository.deleteReviewById(reviewId, customerId);

  // 삭제 후 평균 별점 재계산
  const remainingReviews = await reviewRepository.findAllByDriver(driverId);

  let newAverage = 0;
  if (remainingReviews.length > 0) {
    const total = remainingReviews.reduce((sum, r) => sum + r.rating, 0);
    newAverage = total / remainingReviews.length;
  }

  await driverRepository.updateAverageRating(driverId, newAverage);

  return;
}

//내가 쓴 리뷰
async function getMyReviews(customerId: string) {
  return reviewRepository.getMyReviews(customerId);
}
export default { getAllCompleted, createReview, getMyReviews, deleteReview };
