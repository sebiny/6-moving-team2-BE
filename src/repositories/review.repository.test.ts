import reviewRepository from "../repositories/review.repository";
import prisma from "../config/prisma";
import { CustomError } from "../utils/customError";

jest.mock("../config/prisma", () => ({
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
    delete: jest.fn()
  }
}));

describe("reviewRepository", () => {
  afterEach(() => jest.clearAllMocks());

  describe("findAllCompletedEstimateRequest", () => {
    it("페이지네이션과 견적을 가져온다.", async () => {
      (prisma.estimateRequest.findMany as jest.Mock).mockResolvedValue([{ id: "e1" }]);
      (prisma.estimateRequest.count as jest.Mock).mockResolvedValue(1);

      const result = await reviewRepository.findAllCompletedEstimateRequest("cust1", 1);

      expect(prisma.estimateRequest.findMany).toHaveBeenCalled();
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
    it("리뷰가 not Found 거나 unathorized면은 오류를 반환한다.", async () => {
      (prisma.review.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(reviewRepository.deleteReviewById("r1", "cust1")).rejects.toThrow(CustomError);
    });

    it("유저가 customerId가 맞으면 리뷰를 삭제한다.", async () => {
      (prisma.review.findUnique as jest.Mock).mockResolvedValue({
        id: "r1",
        customerId: "cust1"
      });
      (prisma.review.delete as jest.Mock).mockResolvedValue(undefined);

      await reviewRepository.deleteReviewById("r1", "cust1");

      expect(prisma.review.delete).toHaveBeenCalledWith({ where: { id: "r1" } });
    });
  });

  describe("findAllByDriver", () => {
    it("드라이버의 모든 리뷰를 반환한다.", async () => {
      const mockReviews = [{ rating: 4 }, { rating: 5 }];
      (prisma.review.findMany as jest.Mock).mockResolvedValue(mockReviews);

      const result = await reviewRepository.findAllByDriver("drv1");
      expect(result).toEqual(mockReviews);
      expect(prisma.review.findMany).toHaveBeenCalledWith({
        where: { driverId: "drv1" },
        select: { rating: true }
      });
    });
  });

  describe("findReviewById", () => {
    it("driverId 와 customerId로 리뷰를 반환한다.", async () => {
      const mockReview = { driverId: "drv1", customerId: "cust1" };
      (prisma.review.findUnique as jest.Mock).mockResolvedValue(mockReview);

      const result = await reviewRepository.findReviewById("r1", "cust1");
      expect(result).toEqual(mockReview);
    });
  });
});
