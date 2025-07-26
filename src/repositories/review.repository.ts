import prisma from "../config/prisma";
import { CreateReviewInput, ReviewInput } from "../types/review.type";
import { CustomError } from "../utils/customError";

//작성가능한 견적(리뷰)
async function findAllCompletedEstimateRequest(customerId: string) {
  return prisma.estimateRequest.findMany({
    where: {
      customerId,
      status: "APPROVED",
      review: null
    },
    select: {
      id: true,
      moveType: true,
      moveDate: true,
      fromAddress: {
        select: {
          region: true,
          district: true
        }
      },
      toAddress: {
        select: {
          region: true,
          district: true
        }
      },
      estimates: {
        where: {
          status: "ACCEPTED"
        },
        select: {
          id: true,
          price: true,
          driver: {
            select: {
              id: true,
              nickname: true,
              profileImage: true,
              shortIntro: true
            }
          }
        }
      }
    }
  });
}

//리뷰 작성하기
async function createReview(data: CreateReviewInput) {
  return prisma.review.create({ data });
}

async function findByCustomerAndEstimate(customerId: string, estimateRequestId: string) {
  return prisma.review.findFirst({
    where: {
      customerId,
      estimateRequestId
    }
  });
}

//리뷰 삭제
async function deleteReviewById(reviewId: string, customerId: string) {
  // 리뷰 먼저 찾고
  const review = await prisma.review.findUnique({
    where: { id: reviewId }
  });

  if (!review || review.customerId !== customerId) {
    throw new CustomError(403, "삭제 권한이 없습니다.");
  }

  // 그다음 삭제
  await prisma.review.delete({
    where: { id: reviewId }
  });
}
async function findReviewById(reviewId: string, customerId: string) {
  return prisma.review.findUnique({
    where: { id: reviewId },
    select: {
      driverId: true,
      customerId: true
    }
  });
}

//기사님 모든 리뷰 불러오기
async function findAllByDriver(driverId: string) {
  return prisma.review.findMany({
    where: { driverId },
    select: { rating: true }
  });
}

//내가 쓴 리뷰 가져오기
async function getMyReviews(customerId: string) {
  return prisma.review.findMany({
    where: { customerId },
    select: {
      id: true,
      rating: true,
      content: true,
      driver: {
        select: {
          averageRating: true,
          nickname: true,
          profileImage: true,
          shortIntro: true
        }
      },
      request: {
        select: {
          moveDate: true,
          fromAddress: {
            select: {
              region: true,
              district: true
            }
          },
          toAddress: {
            select: {
              region: true,
              district: true
            }
          }
        }
      }
    }
  });
}

export default {
  findAllCompletedEstimateRequest,
  createReview,
  getMyReviews,
  findByCustomerAndEstimate,
  findAllByDriver,
  deleteReviewById,
  findReviewById
};

// EstimateRequest의 status가 COMLPETED면은 가져오기
//estimates의 price, driver의 profileImage, shortIntro
