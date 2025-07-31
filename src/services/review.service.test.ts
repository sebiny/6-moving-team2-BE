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
    it("should throw error if review already exists", async () => {
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

    it("should create review and update driver rating", async () => {
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
    it("should throw error if review not found", async () => {
      (reviewRepository.findReviewById as jest.Mock).mockResolvedValue(null);

      await expect(reviewService.deleteReview("review1", "cust1")).rejects.toThrow(CustomError);
    });

    it("should delete review and update driver rating", async () => {
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

    it("should handle no remaining reviews", async () => {
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
    it("should call repository with correct args", async () => {
      (reviewRepository.findAllCompletedEstimateRequest as jest.Mock).mockResolvedValue([{ id: "e1" }]);

      const result = await reviewService.getAllCompleted("cust1", 1);
      expect(result).toEqual([{ id: "e1" }]);
      expect(reviewRepository.findAllCompletedEstimateRequest).toHaveBeenCalledWith("cust1", 1);
    });
  });

  describe("getMyReviews", () => {
    it("should call repository with correct args", async () => {
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
