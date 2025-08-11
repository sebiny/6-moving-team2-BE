import prisma from "../config/prisma";
import { CreateReviewInput } from "../types/review.type";
import { CustomError } from "../utils/customError";

//작성가능한 견적(리뷰)
async function findAllCompletedEstimateRequest(customerId: string, page: number) {
  const PAGE_SIZE = 3;
  const skip = (page - 1) * PAGE_SIZE;
  const [reviewableEstimates, totalCount] = await Promise.all([
    prisma.estimateRequest.findMany({
      where: {
        customerId,
        status: "COMPLETED",
        review: { is: null },
        estimates: {
          some: {
            status: "ACCEPTED"
          }
        }
      },
      orderBy: { createdAt: "desc" },
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
            isDesignated: true,
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
      },
      skip: skip,
      take: PAGE_SIZE
    }),
    prisma.estimateRequest.count({
      where: {
        customerId,
        status: "COMPLETED",
        review: { is: null }, // 리뷰 row 자체가 없는 경우
        estimates: {
          some: {
            status: "ACCEPTED"
          }
        }
      }
    })
  ]);
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return { reviewableEstimates, totalCount, totalPages };
}

//내가 쓴 리뷰 가져오기
async function getMyReviews(customerId: string, page: number) {
  const PAGE_SIZE = 3;
  const skip = (page - 1) * PAGE_SIZE;

  const [reviews, totalCount] = await Promise.all([
    prisma.review.findMany({
      where: { customerId, deletedAt: null },

      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        rating: true,
        content: true,
        driver: {
          select: {
            averageRating: true,
            nickname: true,
            profileImage: true,
            shortIntro: true,
            id: true
          }
        },
        request: {
          select: {
            moveDate: true,
            moveType: true,
            estimates: {
              where: {
                status: "ACCEPTED"
              },
              select: {
                isDesignated: true
              }
            },
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
      },
      skip: skip,
      take: PAGE_SIZE
    }),
    prisma.review.count({
      where: { customerId, deletedAt: null }
    })
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return {
    reviews,
    totalCount,
    totalPages
  };
}
//리뷰 작성하기
async function createReview(data: CreateReviewInput) {
  return prisma.review.create({ data });
}

//고객이 작성한 리뷰가 있는지 확인
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
  const review = await prisma.review.findUnique({
    where: { id: reviewId }
  });
  if (!review || review.customerId !== customerId) {
    throw new CustomError(403, "삭제 권한이 없습니다.");
  }
  await prisma.review.update({
    where: { id: reviewId },
    data: {
      deletedAt: new Date()
    }
  });
}
//리뷰 수정
async function updateReviewById(reviewId: string, updateData: Partial<CreateReviewInput>) {
  const review = await prisma.review.findUnique({
    where: { id: reviewId }
  });
  if (!review) throw new CustomError(404, "리뷰를 찾을 수 없습니다.");

  await prisma.review.update({
    where: { id: reviewId },
    data: updateData
  });
}

export default {
  findAllCompletedEstimateRequest,
  createReview,
  getMyReviews,
  findByCustomerAndEstimate,
  deleteReviewById,
  updateReviewById
};

// EstimateRequest의 status가 COMLPETED면은 가져오기
//estimates의 price, driver의 profileImage, shortIntro
