import prisma from "../config/prisma";
import { CreateReviewInput } from "../types/review.type";

//작성가능한 견적(리뷰)
async function findAllCompletedEstimateRequest(customerId: string) {
  return prisma.estimateRequest.findMany({
    where: {
      status: "PENDING"
      //COMPLETED임
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
          price: true,
          driver: {
            select: {
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

//내가 쓴 리뷰 가져오기
async function getMyReviews(customerId: string) {
  return prisma.review.findMany({
    select: {
      rating: true,
      content: true,
      driver: {
        select: {
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
  getMyReviews
};

// EstimateRequest의 status가 COMLPETED면은 가져오기
//estimates의 price, driver의 profileImage, shortIntro
