import estimateReqController from "../controllers/estimateReq.controller";
import estimateReqService from "../services/estimateReq.service";
import notificationService from "../services/notification.service";
import { CustomError } from "../utils/customError";

jest.mock("../services/estimateReq.service");
jest.mock("../services/notification.service");

describe("EstimateReq Controller", () => {
  const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };
  const mockRequest = (body = {}, user = {}) => ({ body, user }) as any;
  const next = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("linkCustomerAddress - 고객 주소 연결", () => {
    test("필수 정보가 포함된 요청이면 고객 주소를 성공적으로 연결하고 201을 반환한다", async () => {
      const req = mockRequest({ addressId: "addr-1", role: "FROM" }, { customerId: "cust-1" });
      const res = mockResponse();
      const mockLink = { id: "link-1" };

      (estimateReqService.linkCustomerAddress as jest.Mock).mockResolvedValue(mockLink);

      await estimateReqController.linkCustomerAddress(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockLink);
    });

    test("addressId 또는 role이 누락된 경우 400 에러를 반환한다", async () => {
      const req = mockRequest({}, { customerId: "cust-1" });
      const res = mockResponse();

      await estimateReqController.linkCustomerAddress(req, res, next);

      const error = (next as jest.Mock).mock.calls[0][0];
      expect(error.statusCode).toBe(400);
    });
  });

  describe("createEstimateRequest - 일반 견적 요청 생성", () => {
    test("정상적인 요청이면 견적 요청을 생성하고 201 상태 코드와 함께 응답한다", async () => {
      const req = mockRequest(
        { moveType: "HOME", moveDate: "2025-08-01", fromAddressId: "from", toAddressId: "to" },
        { customerId: "cust-1" }
      );
      const res = mockResponse();
      const mockResult = { id: "req-1" };

      (estimateReqService.createEstimateRequest as jest.Mock).mockResolvedValue(mockResult);

      await estimateReqController.createEstimateRequest(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    test("출발지와 도착지가 동일한 경우 400 에러를 발생시킨다", async () => {
      const req = mockRequest(
        { moveType: "HOME", moveDate: "2025-08-01", fromAddressId: "same", toAddressId: "same" },
        { customerId: "cust-1" }
      );
      const res = mockResponse();

      await estimateReqController.createEstimateRequest(req, res, next);

      const error = (next as jest.Mock).mock.calls[0][0];
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe("sameAddressNotAllowed");
    });
  });

  describe("createDesignatedEstimateRequest - 지정 기사 견적 요청", () => {
    test("driverId가 포함되어 있다면 지정 견적 요청에 성공하고 201을 반환한다", async () => {
      const req = mockRequest({ driverId: "drv-1" }, { customerId: "cust-1" });
      const res = mockResponse();
      const mockResult = { id: "designated-1" };

      (estimateReqService.createDesignatedEstimateRequest as jest.Mock).mockResolvedValue(mockResult);

      await estimateReqController.createDesignatedEstimateRequest(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: "지정 견적 요청 완료", data: mockResult });
    });

    test("driverId가 누락된 경우 400 에러를 반환한다", async () => {
      const req = mockRequest({}, { customerId: "cust-1" });
      const res = mockResponse();

      await estimateReqController.createDesignatedEstimateRequest(req, res, next);

      const error = (next as jest.Mock).mock.calls[0][0];
      expect(error.statusCode).toBe(400);
      expect(error.message).toContain("기사 ID가 필요합니다.");
    });
  });

  describe("getActiveEstimateRequest - 활성 견적 요청 조회", () => {
    test("customerId가 있다면 해당 고객의 활성 견적 요청을 조회하고 반환한다", async () => {
      const req = mockRequest({}, { customerId: "cust-1" });
      const res = mockResponse();
      const mockActive = { id: "req-123", status: "PENDING" };

      (estimateReqService.getActiveEstimateRequest as jest.Mock).mockResolvedValue(mockActive);

      await estimateReqController.getActiveEstimateRequest(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockActive);
    });

    test("customerId가 없을 경우 400 에러를 반환한다", async () => {
      const req = mockRequest({}, {});
      const res = mockResponse();

      await estimateReqController.getActiveEstimateRequest(req, res, next);

      const error = (next as jest.Mock).mock.calls[0][0];
      expect(error.statusCode).toBe(400);
      expect(error.message).toContain("고객 ID가 필요합니다.");
    });
  });
});
