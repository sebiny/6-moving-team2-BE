import { MoveType, RegionType } from "@prisma/client";
import driverService from "../services/driver.service";
import estimateReqService from "../services/estimateReq.service";
import notificationService from "../services/notification.service";
import driverController from "./driver.controller";

describe("Driver Private Controller (인증 필요)", () => {
  const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  const mockRequest = (user = {}, query = {}, params = {}, body = {}) => ({ user, query, params, body }) as any;

  const testDriverAuthenticationFailure = async (controllerMethod: Function, reqParams: any = {}) => {
    const req = mockRequest({}, reqParams.query || {}, reqParams.params || {}, reqParams.body || {});
    const res = mockResponse();
    const next = jest.fn();
    await controllerMethod(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Driver not authenticated" });
  };

  let res: any;
  let next: any;

  beforeEach(() => {
    jest.clearAllMocks();
    res = mockResponse();
    next = jest.fn();
  });

  describe("getAllDriversAuth", () => {
    test("회원 기사 목록 조회 성공", async () => {
      const req = mockRequest({ customerId: "c1" }, { keyword: "기사", page: "1" });
      const mockDrivers = [{ id: "d1", name: "기사1" }] as any;

      const getAllDriversSpy = jest.spyOn(driverService, "getAllDrivers").mockResolvedValue(mockDrivers);

      await driverController.getAllDriversAuth(req, res, next);

      expect(getAllDriversSpy).toHaveBeenCalledWith(
        {
          keyword: "기사",
          orderBy: undefined,
          region: undefined,
          service: undefined,
          page: 1
        },
        "c1"
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockDrivers);
    });
  });

  describe("getDriverByIdAuth", () => {
    test("기사 상세 조회 (회원)", async () => {
      const req = mockRequest({ customerId: "c1" }, {}, { id: "d1" });
      const mockDriver = { id: "d1", name: "기사1" } as any;

      const getDriverByIdSpy = jest.spyOn(driverService, "getDriverById").mockResolvedValue(mockDriver);

      await driverController.getDriverByIdAuth(req, res, next);

      expect(getDriverByIdSpy).toHaveBeenCalledWith("d1", "c1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockDriver);
    });
  });

  describe("getDesignatedEstimateRequests", () => {
    test("지정견적요청 조회 성공", async () => {
      const req = mockRequest({ driverId: "d1" });
      const mockRequests = [{ id: "req1", status: "PENDING" }] as any;

      const getDesignatedEstimateRequestsSpy = jest
        .spyOn(driverService, "getDesignatedEstimateRequests")
        .mockResolvedValue(mockRequests);

      await driverController.getDesignatedEstimateRequests(req, res, next);

      expect(getDesignatedEstimateRequestsSpy).toHaveBeenCalledWith("d1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockRequests);
    });

    test("기사님 인증 실패 시 401 반환", async () => {
      await testDriverAuthenticationFailure(driverController.getDesignatedEstimateRequests);
    });
  });

  describe("getAvailableEstimateRequests", () => {
    test("일반견적요청 조회 성공", async () => {
      const req = mockRequest({ driverId: "d1" });
      const mockRequests = [{ id: "req1", status: "PENDING" }] as any;

      const getAvailableEstimateRequestsSpy = jest
        .spyOn(driverService, "getAvailableEstimateRequests")
        .mockResolvedValue(mockRequests);

      await driverController.getAvailableEstimateRequests(req, res, next);

      expect(getAvailableEstimateRequestsSpy).toHaveBeenCalledWith("d1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockRequests);
    });

    test("기사님 인증 실패 시 401 반환", async () => {
      await testDriverAuthenticationFailure(driverController.getAvailableEstimateRequests);
    });
  });

  describe("getAllEstimateRequests", () => {
    test("모든 견적 요청 조회 성공", async () => {
      const req = mockRequest({ driverId: "d1" });
      const mockRequests = [{ id: "req1", status: "PENDING" }] as any;

      const getAllEstimateRequestsSpy = jest
        .spyOn(driverService, "getAllEstimateRequests")
        .mockResolvedValue(mockRequests);

      await driverController.getAllEstimateRequests(req, res, next);

      expect(getAllEstimateRequestsSpy).toHaveBeenCalledWith("d1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockRequests);
    });

    test("기사님 인증 실패 시 401 반환", async () => {
      await testDriverAuthenticationFailure(driverController.getAllEstimateRequests);
    });
  });

  describe("createEstimate", () => {
    test("견적 생성 성공", async () => {
      const req = mockRequest({ driverId: "d1" }, {}, { requestId: "req1" }, { price: 0, message: "견적 메시지" });
      
      console.log("DriverId from user:", req.user?.driverId);
      console.log("DriverId exists:", !!req.user?.driverId);
      
      console.log("Price type:", typeof req.body.price);
      console.log("Price value:", req.body.price);
      
      console.log("Request body:", req.body);
      console.log("Request params:", req.params);
      console.log("Request user:", req.user);
      const mockEstimate = { id: "est1", price: 50000 } as any;
      const mockEstimateRequest = {
        id: "req1",
        status: "PENDING",
        moveDate: new Date(Date.now() + 86400000 * 30), // 30일 후 날짜로 변경
        customerId: "c1",
        moveType: "SMALL"
      } as any;
      
      console.log("Mock estimateRequest:", mockEstimateRequest);

      // spyOn을 사용한 mock 설정
      const findRequestByIdSpy = jest
        .spyOn(estimateReqService, "findRequestById")
        .mockResolvedValue(mockEstimateRequest);
      const findEstimateByDriverAndRequestSpy = jest
        .spyOn(driverService, "findEstimateByDriverAndRequest")
        .mockResolvedValue(null);
      const checkResponseLimitSpy = jest.spyOn(driverService, "checkResponseLimit").mockResolvedValue({
        canRespond: true,
        limit: 5,
        currentCount: 0,
        message: "응답 가능합니다"
      });
      const createEstimateSpy = jest.spyOn(driverService, "createEstimate").mockResolvedValue(mockEstimate);
      const createEstimateProposalNotificationSpy = jest
        .spyOn(notificationService, "createEstimateProposalNotification")
        .mockResolvedValue(undefined);
      


      await driverController.createEstimate(req, res, next);

      // 실제 응답 확인
      console.log("Response status:", res.status.mock.calls);
      console.log("Response json:", res.json.mock.calls);
      console.log("CreateEstimateSpy calls:", createEstimateSpy.mock.calls);
      console.log("Next function calls:", next.mock.calls);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "견적 요청을 찾을 수 없습니다." });
    });

    test("기사님 인증 실패 시 401 반환", async () => {
      await testDriverAuthenticationFailure(driverController.createEstimate, {
        params: { requestId: "req1" },
        body: { price: 50000, message: "견적 메시지" }
      });
    });

    test("유효하지 않은 견적가 입력 시 400 반환", async () => {
      const req = mockRequest({ driverId: "d1" }, {}, { requestId: "req1" }, { price: -1000, message: "견적 메시지" });

      await driverController.createEstimate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "유효한 견적가를 입력해주세요." });
    });
  });

  describe("rejectEstimateRequest", () => {
    test("견적 요청 반려 성공", async () => {
      const req = mockRequest({ driverId: "d1" }, {}, { requestId: "req1" }, { reason: "반려 사유" });
      const mockResult = { id: "rej1", reason: "반려 사유" } as any;
      const mockEstimateRequest = {
        id: "req1",
        status: "PENDING",
        moveDate: new Date(Date.now() + 86400000) // 내일 날짜
      } as any;

      // spyOn을 사용한 mock 설정
      const findRequestByIdSpy = jest
        .spyOn(estimateReqService, "findRequestById")
        .mockResolvedValue(mockEstimateRequest);
      const findEstimateByDriverAndRequestSpy = jest
        .spyOn(driverService, "findEstimateByDriverAndRequest")
        .mockResolvedValue(null);
      const checkIfAlreadyRejectedSpy = jest
        .spyOn(estimateReqService, "checkIfAlreadyRejected")
        .mockResolvedValue(false);
      const checkResponseLimitSpy = jest.spyOn(driverService, "checkResponseLimit").mockResolvedValue({
        canRespond: true,
        limit: 5,
        currentCount: 0,
        message: "응답 가능합니다"
      });
      const rejectEstimateRequestSpy = jest
        .spyOn(estimateReqService, "rejectEstimateRequest")
        .mockResolvedValue(mockResult);

      await driverController.rejectEstimateRequest(req, res, next);

      expect(rejectEstimateRequestSpy).toHaveBeenCalledWith("d1", "req1", "반려 사유");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "견적 요청이 반려되었습니다.",
        data: mockResult
      });
    });

    test("기사님 인증 실패 시 401 반환", async () => {
      await testDriverAuthenticationFailure(driverController.rejectEstimateRequest, {
        params: { requestId: "req1" },
        body: { reason: "반려 사유" }
      });
    });
  });

  describe("getMyEstimates", () => {
    test("내 견적 조회 성공", async () => {
      const req = mockRequest({ driverId: "d1" });
      const mockEstimates = [{ id: "est1", price: 50000 }] as any;

      const getMyEstimatesSpy = jest.spyOn(driverService, "getMyEstimates").mockResolvedValue(mockEstimates);

      await driverController.getMyEstimates(req, res, next);

      expect(getMyEstimatesSpy).toHaveBeenCalledWith("d1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockEstimates);
    });

    test("기사님 인증 실패 시 401 반환", async () => {
      await testDriverAuthenticationFailure(driverController.getMyEstimates);
    });
  });

  describe("getEstimateDetail", () => {
    test("견적 상세 조회 성공", async () => {
      const req = mockRequest({ driverId: "d1" }, {}, { estimateId: "est1" });
      const mockEstimate = { id: "est1", price: 50000 } as any;

      const getEstimateDetailSpy = jest.spyOn(driverService, "getEstimateDetail").mockResolvedValue(mockEstimate);

      await driverController.getEstimateDetail(req, res, next);

      expect(getEstimateDetailSpy).toHaveBeenCalledWith("d1", "est1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockEstimate);
    });

    test("견적을 찾을 수 없을 때 404 반환", async () => {
      const req = mockRequest({ driverId: "d1" }, {}, { estimateId: "est1" });

      const getEstimateDetailSpy = jest.spyOn(driverService, "getEstimateDetail").mockResolvedValue(null);

      await driverController.getEstimateDetail(req, res, next);

      expect(getEstimateDetailSpy).toHaveBeenCalledWith("d1", "est1");
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "견적을 찾을 수 없습니다." });
    });

    test("기사님 인증 실패 시 401 반환", async () => {
      await testDriverAuthenticationFailure(driverController.getEstimateDetail, {
        params: { estimateId: "est1" }
      });
    });
  });

  describe("getRejectedEstimateRequests", () => {
    test("반려한 견적 요청 조회 성공", async () => {
      const req = mockRequest({ driverId: "d1" });
      const mockRejectedRequests = [{ id: "req1", status: "REJECTED" }] as any;

      const getRejectedEstimateRequestsSpy = jest
        .spyOn(driverService, "getRejectedEstimateRequests")
        .mockResolvedValue(mockRejectedRequests);

      await driverController.getRejectedEstimateRequests(req, res, next);

      expect(getRejectedEstimateRequestsSpy).toHaveBeenCalledWith("d1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockRejectedRequests);
    });

    test("기사님 인증 실패 시 401 반환", async () => {
      await testDriverAuthenticationFailure(driverController.getRejectedEstimateRequests);
    });
  });
});
