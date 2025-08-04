import reviewService from "../services/review.service";
import reviewRepository from "../repositories/review.repository";
import driverRepository from "../repositories/driver.repository";
import { CustomError } from "../utils/customError";

jest.mock("../repositories/review.repository");
jest.mock("../repositories/driver.repository");

describe("reviewService", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createReview", () => {
    it("리뷰가 이미 있으면 에러를 반환한다.", async () => {
      (reviewRepository.findByCustomerAndEstimate as jest.Mock).mockResolvedValue({ id: "existing" });

      const data = {
        customerId: "cust1",
        estimateRequestId: "est1",
        driverId: "drv1",
        content: "좋아요",
        rating: 4
      };

      await expect(reviewService.createReview(data)).rejects.toThrow(CustomError);
    });

    it("리뷰를 생성하고 기사평균평점을 업데이트 한다.", async () => {
      (reviewRepository.findByCustomerAndEstimate as jest.Mock).mockResolvedValue(null);
      (reviewRepository.createReview as jest.Mock).mockResolvedValue({ id: "new-review" });
      (reviewRepository.findAllByDriver as jest.Mock).mockResolvedValue([{ rating: 4 }, { rating: 5 }]);
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
      expect(driverRepository.updateAverageRating).toHaveBeenCalledWith("drv1", (4 + 5 + 5) / 3);
      expect(result).toEqual({ id: "new-review" });
    });
  });

  describe("deleteReview", () => {
    it("리뷰가 없으면 에러를 던진다.", async () => {
      (reviewRepository.findReviewById as jest.Mock).mockResolvedValue(null);
      await expect(reviewService.deleteReview("review1", "cust1")).rejects.toThrow(CustomError);
    });

    it("리뷰를 지우고 기사평균평점을 업데이트한다.", async () => {
      (reviewRepository.findReviewById as jest.Mock).mockResolvedValue({
        id: "review1",
        driverId: "drv1"
      });

      (reviewRepository.deleteReviewById as jest.Mock).mockResolvedValue(undefined);
      (reviewRepository.findAllByDriver as jest.Mock).mockResolvedValue([{ rating: 3 }, { rating: 4 }]);

      await reviewService.deleteReview("review1", "cust1");

      expect(reviewRepository.deleteReviewById).toHaveBeenCalledWith("review1", "cust1");
      expect(driverRepository.updateAverageRating).toHaveBeenCalledWith("drv1", 3.5);
    });

    it("남은 리뷰가 없을 때 처리", async () => {
      (reviewRepository.findReviewById as jest.Mock).mockResolvedValue({
        id: "review1",
        driverId: "drv1"
      });

      (reviewRepository.findAllByDriver as jest.Mock).mockResolvedValue([]);
      (reviewRepository.deleteReviewById as jest.Mock).mockResolvedValue(undefined);

      await reviewService.deleteReview("review1", "cust1");

      expect(driverRepository.updateAverageRating).toHaveBeenCalledWith("drv1", 0);
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
