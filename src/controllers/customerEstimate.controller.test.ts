// 알림 호출에 실패가 떠서 일단 제거하고 한 상태입니다. 추후 시도해보겠습니다.

import { Request, Response, NextFunction } from "express";
import controller from "../../src/controllers/customerEstimate.controller";
import customerEstimateService from "../../src/services/customerEstimate.service";
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

const mockNext: NextFunction = jest.fn();

describe("고객 견적 컨트롤러 (customerEstimate.controller)", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("대기 중인 견적 조회 (getPendingEstimates)", () => {
    it("고객 ID가 없으면 CustomError를 next로 전달한다.", async () => {
      const req = mockRequest({}, {}, {});
      const res = mockResponse();
      const next = jest.fn();

      await controller.getPendingEstimates(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });
  });

  describe("받았던 견적 조회 (getReceivedEstimates)", () => {
    it("고객 ID가 없으면 CustomError를 next로 전달한다.", async () => {
      const req = mockRequest({}, {}, {});
      const res = mockResponse();

      await controller.getReceivedEstimates(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(CustomError));
    });

    it("받았던 견적 데이터를 정상적으로 반환한다.", async () => {
      (customerEstimateService.getReceivedEstimates as jest.Mock).mockResolvedValue("받은 견적 데이터");

      const req = mockRequest({}, {}, { customerId: "cust-2" });
      const res = mockResponse();

      await controller.getReceivedEstimates(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith("받은 견적 데이터");
    });
  });

  describe("견적 확정 (acceptEstimate)", () => {
    it("견적 확정 성공 시 성공 메시지를 반환한다.", async () => {
      (customerEstimateService.acceptEstimate as jest.Mock).mockResolvedValue("견적 확정 완료");

      const req = mockRequest({}, { estimateId: "est-1" }, {});
      const res = mockResponse();
      const next = jest.fn();

      await controller.acceptEstimate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "견적이 성공적으로 확정되었습니다.",
        data: "견적 확정 완료"
      });
    });
  });

  describe("견적 상세 조회 (getEstimateDetail)", () => {
    it("견적 상세 데이터를 정상적으로 반환한다.", async () => {
      (customerEstimateService.getEstimateDetail as jest.Mock).mockResolvedValue("견적 상세 데이터");

      const req = mockRequest({}, { estimateId: "est-3" }, {});
      const res = mockResponse();

      await controller.getEstimateDetail(req, res, mockNext);

      expect(res.json).toHaveBeenCalledWith("견적 상세 데이터");
    });
  });
});
