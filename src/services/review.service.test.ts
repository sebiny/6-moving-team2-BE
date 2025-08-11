import reviewService from "../services/review.service";
import reviewRepository from "../repositories/review.repository";
import driverRepository from "../repositories/driver.repository";
import prisma from "../config/prisma";

jest.mock("../repositories/review.repository");
jest.mock("../repositories/driver.repository");
jest.mock("../config/prisma");
jest.mock("../config/prisma", () => ({
  review: {
    aggregate: jest.fn(),
    create: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn()
  },
  estimateRequest: {
    findMany: jest.fn(),
    count: jest.fn()
  }
}));

describe("reviewService", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createReview", () => {
    it("리뷰를 생성하고 기사평균평점을 업데이트 한다.", async () => {
      (reviewRepository.findByCustomerAndEstimate as jest.Mock).mockResolvedValue(null);
      (reviewRepository.createReview as jest.Mock).mockResolvedValue({ id: "new-review" });
      (prisma.review.aggregate as jest.Mock).mockResolvedValue({ _avg: { rating: 4.6667 } });
      (driverRepository.updateAverageRating as jest.Mock).mockResolvedValue(undefined);

      const data = {
        customerId: "cust1",
        estimateRequestId: "est1",
        driverId: "drv1",
        content: "좋아요",
        rating: 5
      };

      const result = await reviewService.createReview(data);

      expect(reviewRepository.createReview).toHaveBeenCalledWith(data);
      expect(driverRepository.updateAverageRating).toHaveBeenCalledWith("drv1", 4.6667);
      expect(result).toEqual({ id: "new-review" });
    });
  });
  describe("getAllCompleted", () => {
    it("올바른 인자로 repository를 호출해야 한다", async () => {
      (reviewRepository.findAllCompletedEstimateRequest as jest.Mock).mockResolvedValue([{ id: "e1" }]);

      const result = await reviewService.getAllCompleted("cust1", 1);
      expect(result).toEqual([{ id: "e1" }]);
      expect(reviewRepository.findAllCompletedEstimateRequest).toHaveBeenCalledWith("cust1", 1);
    });
  });
  describe("deleteReview", () => {
    it("리뷰 삭제 후 기사평균평점 업데이트", async () => {
      (reviewRepository.deleteReviewById as jest.Mock).mockResolvedValue(undefined);
      (prisma.review.aggregate as jest.Mock).mockResolvedValue({ _avg: { rating: 4.5 } });
      (driverRepository.updateAverageRating as jest.Mock).mockResolvedValue(undefined);

      const result = await reviewService.deleteReview("rev1", "cust1", "drv1");

      expect(reviewRepository.deleteReviewById).toHaveBeenCalledWith("rev1", "cust1");
      expect(driverRepository.updateAverageRating).toHaveBeenCalledWith("drv1", 4.5);
      expect(result).toEqual({ message: "리뷰 삭제 완료" });
    });
  });

  describe("getMyReviews", () => {
    it("올바른 인자로 repository를 호출해야 한다", async () => {
      (reviewRepository.getMyReviews as jest.Mock).mockResolvedValue({
        reviews: [{ id: "r1" }],
        totalCount: 1,
        totalPages: 1
      });

      const result = await reviewService.getMyReviews("cust1", 1);
      expect(result).toEqual({
        reviews: [{ id: "r1" }],
        totalCount: 1,
        totalPages: 1
      });
      expect(reviewRepository.getMyReviews).toHaveBeenCalledWith("cust1", 1);
    });
  });
});
