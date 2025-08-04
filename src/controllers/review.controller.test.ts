import reviewController from "../controllers/review.controller";
import reviewService from "../services/review.service"; // 실제 경로 사용
import { Request, Response } from "express";
import { CustomError } from "../utils/customError";

jest.mock("../services/review.service");
const next = jest.fn();

const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("reviewController", () => {
  const mockUser = { customerId: "customer-123" };

  describe("getAllCompletedEstimate", () => {
    it("리뷰 가능한 견적이 있을 경우 200상태코드와 함께 반환", async () => {
      const req = {
        user: mockUser,
        query: { page: "1" }
      } as unknown as Request;

      const res = mockResponse();

      (reviewService.getAllCompleted as jest.Mock).mockResolvedValue({
        reviewableEstimates: [{ id: 1 }]
      });

      await reviewController.getAllCompletedEstimate(req, res, next);

      expect(reviewService.getAllCompleted).toHaveBeenCalledWith("customer-123", 1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        reviewableEstimates: [{ id: 1 }]
      });
    });
  });

  describe("getMyReviews", () => {
    it("리뷰들을 200상태코드로 반환", async () => {
      const req = {
        user: mockUser,
        query: { page: "1" }
      } as unknown as Request;
      const res = mockResponse();

      (reviewService.getMyReviews as jest.Mock).mockResolvedValue({
        reviews: [{ id: "r1" }],
        totalCount: 1,
        totalPages: 1
      });

      await reviewController.getMyReviews(req, res, next);

      expect(reviewService.getMyReviews).toHaveBeenCalledWith("customer-123", 1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        reviews: [{ id: "r1" }],
        totalCount: 1,
        totalPages: 1
      });
    });
  });

  describe("createReview", () => {
    it("리뷰 생성되면 201 상태코드와 함께 응답", async () => {
      const req = {
        user: mockUser,
        body: {
          content: "좋았어요",
          rating: 5,
          driverId: "driver-123",
          estimateRequestId: "est-123"
        }
      } as unknown as Request;
      const res = mockResponse();

      (reviewService.createReview as jest.Mock).mockResolvedValue({
        id: "new-review-id"
      });

      await reviewController.createReview(req, res, next);

      expect(reviewService.createReview).toHaveBeenCalledWith({
        customerId: "customer-123",
        content: "좋았어요",
        rating: 5,
        driverId: "driver-123",
        estimateRequestId: "est-123"
      });

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "리뷰 작성 완료",
        review: { id: "new-review-id" }
      });
    });
  });

  describe("deleteReview", () => {
    it("리뷰가 삭제되면 200상태코드와 함께 성공 메세지 반환", async () => {
      const req = {
        user: mockUser,
        body: { reviewId: "r1" }
      } as unknown as Request;
      const res = mockResponse();

      (reviewService.deleteReview as jest.Mock).mockResolvedValue(undefined);

      await reviewController.deleteReview(req, res, next);

      expect(reviewService.deleteReview).toHaveBeenCalledWith("r1", "customer-123");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "리뷰가 삭제되었습니다."
      });
    });
  });
});
