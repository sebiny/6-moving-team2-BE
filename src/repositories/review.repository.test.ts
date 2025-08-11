import reviewRepository from "../repositories/review.repository";
import prisma from "../config/prisma";
import { CustomError } from "../utils/customError";

jest.mock("../config/prisma", () => {
  const originalModule = jest.requireActual("../config/prisma");
  return {
    ...originalModule,
    estimateRequest: {
      findMany: jest.fn(),
      count: jest.fn()
    },
    review: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn()
    }
  };
});

describe("reviewRepository", () => {
  afterEach(() => jest.clearAllMocks());

  describe("findAllCompletedEstimateRequest", () => {
    it("페이지네이션과 견적을 가져온다.", async () => {
      (prisma.estimateRequest.findMany as jest.Mock).mockResolvedValue([{ id: "e1" }]);
      (prisma.estimateRequest.count as jest.Mock).mockResolvedValue(1);

      const result = await reviewRepository.findAllCompletedEstimateRequest("cust1", 1);

      expect(prisma.estimateRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            customerId: "cust1",
            status: "COMPLETED",
            OR: expect.any(Array),
            estimates: { some: { status: "ACCEPTED" } }
          }),
          skip: 0,
          take: 3
        })
      );
      expect(result.reviewableEstimates).toEqual([{ id: "e1" }]);
      expect(result.totalPages).toBe(1);
    });
  });

  describe("getMyReviews", () => {
    it("페이지네이션과 리뷰를 반환한다.", async () => {
      (prisma.review.findMany as jest.Mock).mockResolvedValue([{ id: "r1" }]);
      (prisma.review.count as jest.Mock).mockResolvedValue(1);

      const result = await reviewRepository.getMyReviews("cust1", 1);

      expect(prisma.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { customerId: "cust1" },
          skip: 0,
          take: 3
        })
      );

      expect(result.reviews).toEqual([{ id: "r1" }]);
      expect(result.totalCount).toBe(1);
      expect(result.totalPages).toBe(1);
    });
  });

  describe("createReview", () => {
    it("리뷰를 생성한다.", async () => {
      const reviewData = {
        customerId: "cust1",
        driverId: "drv1",
        estimateRequestId: "est1",
        rating: 5,
        content: "test"
      };

      (prisma.review.create as jest.Mock).mockResolvedValue({ id: "new-review" });

      const result = await reviewRepository.createReview(reviewData);

      expect(prisma.review.create).toHaveBeenCalledWith({ data: reviewData });
      expect(result).toEqual({ id: "new-review" });
    });
  });

  describe("findByCustomerAndEstimate", () => {
    it("리뷰가 있으면 반환한다.", async () => {
      const mockReview = { id: "review1" };
      (prisma.review.findFirst as jest.Mock).mockResolvedValue(mockReview);

      const result = await reviewRepository.findByCustomerAndEstimate("cust1", "est1");
      expect(result).toBe(mockReview);
    });
  });

  describe("deleteReviewById", () => {
    it("리뷰가 없거나 권한이 없으면 오류를 반환한다", async () => {
      (prisma.review.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(reviewRepository.deleteReviewById("r1", "cust1")).rejects.toThrow(CustomError);
    });

    it("유저가 customerId가 맞으면 soft delete로 deletedAt을 업데이트 한다", async () => {
      (prisma.review.findUnique as jest.Mock).mockResolvedValue({
        id: "r1",
        customerId: "cust1"
      });
      (prisma.review.update as jest.Mock).mockResolvedValue(undefined);

      await reviewRepository.deleteReviewById("r1", "cust1");

      expect(prisma.review.update).toHaveBeenCalledWith({
        where: { id: "r1" },
        data: { deletedAt: expect.any(Date) }
      });
    });
  });

  describe("updateReviewById", () => {
    it("리뷰가 없으면 404 오류를 던진다", async () => {
      (prisma.review.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(reviewRepository.updateReviewById("r1", { content: "수정" })).rejects.toThrow(CustomError);
    });

    it("리뷰를 업데이트한다", async () => {
      (prisma.review.findUnique as jest.Mock).mockResolvedValue({ id: "r1" });
      (prisma.review.update as jest.Mock).mockResolvedValue(undefined);

      await reviewRepository.updateReviewById("r1", { content: "수정" });

      expect(prisma.review.update).toHaveBeenCalledWith({
        where: { id: "r1" },
        data: { content: "수정" }
      });
    });
  });
});
