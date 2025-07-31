import { Request, Response, NextFunction } from "express";
import controller from "../../src/controllers/customerEstimate.controller";
import customerEstimateService from "../../src/services/customerEstimate.service";
import notificationService from "../../src/services/notification.service";
import { CustomError } from "../../src/utils/customError";

jest.mock("../../src/services/customerEstimate.service", () => ({
  getPendingEstimates: jest.fn(),
  getReceivedEstimates: jest.fn(),
  acceptEstimate: jest.fn(),
  getCustomerAndDriverIdbyEstimateId: jest.fn(),
  getEstimateDetail: jest.fn()
}));

jest.mock("../../src/services/notification.service", () => ({
  createEstimateConfirmNotification: jest.fn()
}));

const mockRequest = (body = {}, params = {}, user = {}) =>
  ({
    body,
    params,
    user
  }) as unknown as Request;

const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("customerEstimate.controller", () => {
  let mockNext: NextFunction;

  beforeEach(() => {
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("대기 중인 견적 조회 (getPendingEstimates)", () => {
    it("고객 ID가 없으면 CustomError를 next로 전달한다.", async () => {
      const req = mockRequest({}, {}, {});
      const res = mockResponse();

      await controller.getPendingEstimates(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(CustomError));
    });

    it("대기 중인 견적을 정상적으로 반환한다.", async () => {
      (customerEstimateService.getPendingEstimates as jest.Mock).mockResolvedValue("pending");

      const req = mockRequest({}, {}, { customerId: "cust-1" });
      const res = mockResponse();

      await controller.getPendingEstimates(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith("pending");
    });
  });

  describe("받았던 견적 조회 (getReceivedEstimates)", () => {
    it("고객 ID가 없으면 CustomError를 next로 전달한다.", async () => {
      const req = mockRequest({}, {}, {});
      const res = mockResponse();

      await controller.getReceivedEstimates(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(CustomError));
    });

    it("받았던 견적을 정상적으로 반환한다.", async () => {
      (customerEstimateService.getReceivedEstimates as jest.Mock).mockResolvedValue("received");

      const req = mockRequest({}, {}, { customerId: "cust-2" });
      const res = mockResponse();

      await controller.getReceivedEstimates(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith("received");
    });
  });

  describe("견적 확정 (acceptEstimate)", () => {
    it("견적 확정 시 성공 메시지를 반환하고 알림을 전송한다.", async () => {
      (customerEstimateService.acceptEstimate as jest.Mock).mockResolvedValue("accepted");
      (customerEstimateService.getCustomerAndDriverIdbyEstimateId as jest.Mock).mockResolvedValue({
        driverId: "drv-1",
        customerId: "cust-1"
      });

      const req = mockRequest({}, { estimateId: "est-1" }, {});
      const res = mockResponse();

      await controller.acceptEstimate(req, res, mockNext);

      // 알림 호출은 비동기적으로 이루어지므로 기다림
      await new Promise(setImmediate);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "견적이 성공적으로 확정되었습니다.",
        data: "accepted"
      });
      expect(notificationService.createEstimateConfirmNotification).toHaveBeenCalledWith({
        driverId: "drv-1",
        customerId: "cust-1",
        estimateId: "est-1"
      });
    });

    it("서비스에서 CustomError가 발생하면 에러 응답을 반환한다.", async () => {
      (customerEstimateService.acceptEstimate as jest.Mock).mockRejectedValue(new CustomError(400, "에러"));

      const req = mockRequest({}, { estimateId: "est-2" }, {});
      const res = mockResponse();

      await controller.acceptEstimate(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "에러" });
    });
  });

  describe("견적 상세 조회 (getEstimateDetail)", () => {
    it("견적 상세 정보를 반환한다.", async () => {
      (customerEstimateService.getEstimateDetail as jest.Mock).mockResolvedValue("detail");

      const req = mockRequest({}, { estimateId: "est-3" }, {});
      const res = mockResponse();

      await controller.getEstimateDetail(req, res, mockNext);

      expect(res.json).toHaveBeenCalledWith("detail");
    });
  });
});
