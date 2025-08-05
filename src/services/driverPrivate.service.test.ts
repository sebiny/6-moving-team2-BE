import driverService from "./driver.service";
import driverRepository from "../repositories/driver.repository";
import estimateReqRepository from "../repositories/estimateReq.repository";

// Repository 모킹
jest.mock("../repositories/driver.repository");
jest.mock("../repositories/estimateReq.repository");

const mockDriverRepository = driverRepository as jest.Mocked<typeof driverRepository>;
const mockEstimateReqRepository = estimateReqRepository as jest.Mocked<typeof estimateReqRepository>;

describe("Driver Service - Private Functions", () => {
  const mockDriverId = "d1";
  const mockEstimateRequestId = "req1";
  const mockEstimateId = "est1";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getDesignatedEstimateRequests - 지정 견적요청 조회", () => {
    test("기사에게 지정된 견적 요청 목록을 성공적으로 조회한다", async () => {
      const mockRequests = [
        {
          id: "req1",
          customerId: "cust1",
          moveType: "HOME",
          moveDate: new Date("2025-08-01"),
          status: "PENDING",
          fromAddressId: "addr1",
          toAddressId: "addr2",
          createdAt: new Date("2025-07-30"),
          customer: {
            authUser: { name: "고객1" }
          },
          fromAddress: { street: "서울시 강남구" },
          toAddress: { street: "서울시 서초구" },
          _count: { estimates: 2 }
        }
      ] as any;

      mockDriverRepository.getDesignatedEstimateRequests.mockResolvedValue(mockRequests);

      const result = await driverService.getDesignatedEstimateRequests(mockDriverId);

      expect(mockDriverRepository.getDesignatedEstimateRequests).toHaveBeenCalledWith(mockDriverId);
      expect(result).toEqual(mockRequests);
    });
  });

  describe("getAvailableEstimateRequests - 일반 견적요청 조회", () => {
    test("기사 서비스 지역의 일반 견적 요청을 성공적으로 조회한다", async () => {
      const mockRequests = [
        {
          id: "req2",
          customerId: "cust2",
          moveType: "SMALL",
          moveDate: new Date("2025-08-02"),
          status: "PENDING",
          fromAddressId: "addr3",
          toAddressId: "addr4",
          createdAt: new Date("2025-07-31"),
          customer: {
            authUser: { name: "고객2" }
          },
          fromAddress: { street: "서울시 마포구" },
          toAddress: { street: "서울시 영등포구" },
          _count: { estimates: 1 }
        }
      ] as any;

      mockDriverRepository.getAvailableEstimateRequests.mockResolvedValue(mockRequests);

      const result = await driverService.getAvailableEstimateRequests(mockDriverId);

      expect(mockDriverRepository.getAvailableEstimateRequests).toHaveBeenCalledWith(mockDriverId);
      expect(result).toEqual(mockRequests);
    });
  });

  describe("getAllEstimateRequests - 모든 견적요청 조회", () => {
    test("지정 견적과 일반 견적을 모두 조회하여 합친다", async () => {
      const mockRequests = [
        {
          id: "req1",
          customerId: "cust1",
          moveType: "HOME",
          moveDate: new Date("2025-08-01"),
          status: "PENDING",
          fromAddressId: "addr1",
          toAddressId: "addr2",
          createdAt: new Date("2025-07-30"),
          customer: {
            authUser: { name: "고객1" }
          },
          fromAddress: { street: "서울시 강남구" },
          toAddress: { street: "서울시 서초구" },
          _count: { estimates: 2 }
        }
      ] as any;

      mockDriverRepository.getAllEstimateRequests.mockResolvedValue(mockRequests);

      const result = await driverService.getAllEstimateRequests(mockDriverId);

      expect(mockDriverRepository.getAllEstimateRequests).toHaveBeenCalledWith(mockDriverId);
      expect(result).toEqual(mockRequests);
    });
  });

  describe("findEstimateByDriverAndRequest - 견적 조회", () => {
    test("기사가 특정 견적 요청에 대해 보낸 견적을 성공적으로 조회한다", async () => {
      const mockEstimate = {
        id: "est1",
        driverId: "d1",
        estimateRequestId: "req1",
        price: 50000,
        comment: "견적서입니다",
        status: "PENDING",
        createdAt: new Date("2025-07-30")
      } as any;

      mockDriverRepository.findEstimateByDriverAndRequest.mockResolvedValue(mockEstimate);

      const result = await driverService.findEstimateByDriverAndRequest(mockDriverId, mockEstimateRequestId);

      expect(mockDriverRepository.findEstimateByDriverAndRequest).toHaveBeenCalledWith(
        mockDriverId,
        mockEstimateRequestId
      );
      expect(result).toEqual(mockEstimate);
    });

    test("견적이 존재하지 않으면 null을 반환한다", async () => {
      mockDriverRepository.findEstimateByDriverAndRequest.mockResolvedValue(null);

      const result = await driverService.findEstimateByDriverAndRequest(mockDriverId, mockEstimateRequestId);

      expect(result).toBeNull();
    });
  });

  describe("createEstimate - 견적 생성", () => {
    const mockEstimateData = {
      driverId: mockDriverId,
      estimateRequestId: mockEstimateRequestId,
      price: 50000,
      comment: "견적서입니다"
    };

    test("견적을 성공적으로 생성한다", async () => {
      const mockCreatedEstimate = {
        id: "est1",
        driverId: "d1",
        estimateRequestId: "req1",
        price: 50000,
        comment: "견적서입니다",
        status: "PENDING",
        createdAt: new Date("2025-07-30")
      } as any;

      mockDriverRepository.createEstimate.mockResolvedValue(mockCreatedEstimate);

      const result = await driverService.createEstimate(mockEstimateData);

      expect(mockDriverRepository.createEstimate).toHaveBeenCalledWith(mockEstimateData);
      expect(result).toEqual(mockCreatedEstimate);
    });
  });

  describe("getMyEstimates - 내 견적 조회", () => {
    test("기사가 보낸 모든 견적을 최신순으로 조회한다", async () => {
      const mockEstimates = [
        {
          id: "est1",
          driverId: "d1",
          estimateRequestId: "req1",
          price: 50000,
          comment: "견적서입니다",
          status: "PENDING",
          createdAt: new Date("2025-07-30"),
          estimateRequest: {
            customer: {
              authUser: { name: "고객1" }
            },
            fromAddress: { street: "서울시 강남구" },
            toAddress: { street: "서울시 서초구" }
          }
        }
      ] as any;

      mockDriverRepository.getMyEstimates.mockResolvedValue(mockEstimates);

      const result = await driverService.getMyEstimates(mockDriverId);

      expect(mockDriverRepository.getMyEstimates).toHaveBeenCalledWith(mockDriverId);
      expect(result).toEqual(mockEstimates);
    });
  });

  describe("getEstimateDetail - 견적 상세 조회", () => {
    test("기사가 보낸 특정 견적의 상세 정보를 성공적으로 조회한다", async () => {
      const mockEstimateDetail = {
        id: "est1",
        driverId: "d1",
        estimateRequestId: "req1",
        price: 50000,
        comment: "견적서입니다",
        status: "PENDING",
        createdAt: new Date("2025-07-30"),
        estimateRequest: {
          customer: {
            authUser: { name: "고객1" }
          },
          fromAddress: { street: "서울시 강남구" },
          toAddress: { street: "서울시 서초구" }
        }
      } as any;

      mockDriverRepository.getEstimateDetail.mockResolvedValue(mockEstimateDetail);

      const result = await driverService.getEstimateDetail(mockDriverId, mockEstimateId);

      expect(mockDriverRepository.getEstimateDetail).toHaveBeenCalledWith(mockDriverId, mockEstimateId);
      expect(result).toEqual(mockEstimateDetail);
    });

    test("견적이 존재하지 않으면 null을 반환한다", async () => {
      mockDriverRepository.getEstimateDetail.mockResolvedValue(null);

      const result = await driverService.getEstimateDetail(mockDriverId, mockEstimateId);

      expect(result).toBeNull();
    });
  });

  describe("getRejectedEstimateRequests - 반려 견적요청 조회", () => {
    test("기사가 반려한 견적 요청 목록을 최신순으로 조회한다", async () => {
      const mockRejections = [
        {
          id: "rej1",
          driverId: "d1",
          estimateRequestId: "req1",
          reason: "일정이 맞지 않습니다",
          createdAt: new Date("2025-07-30"),
          estimateRequest: {
            customer: {
              authUser: { name: "고객1" }
            },
            fromAddress: { street: "서울시 강남구" },
            toAddress: { street: "서울시 서초구" },
            designatedDrivers: [],
            isDesignated: false
          }
        }
      ] as any;

      mockDriverRepository.getRejectedEstimateRequests.mockResolvedValue(mockRejections);

      const result = await driverService.getRejectedEstimateRequests(mockDriverId);

      expect(mockDriverRepository.getRejectedEstimateRequests).toHaveBeenCalledWith(mockDriverId);
      expect(result).toEqual(mockRejections);
    });
  });

  describe("checkResponseLimit - 응답 제한 확인", () => {
    test("일반 견적 요청에서 응답 가능한 경우", async () => {
      const mockResponseLimit = {
        canRespond: true,
        limit: 5,
        currentCount: 3,
        message: "응답 가능합니다."
      };

      mockDriverRepository.checkResponseLimit.mockResolvedValue(mockResponseLimit);

      const result = await driverService.checkResponseLimit(mockEstimateRequestId, mockDriverId);

      expect(mockDriverRepository.checkResponseLimit).toHaveBeenCalledWith(mockEstimateRequestId, mockDriverId);
      expect(result).toEqual(mockResponseLimit);
    });

    test("일반 견적 요청에서 응답 제한을 초과한 경우", async () => {
      const mockResponseLimit = {
        canRespond: false,
        limit: 5,
        currentCount: 5,
        message: "이미 최대 응답 가능 기사님 수를 초과했습니다."
      };

      mockDriverRepository.checkResponseLimit.mockResolvedValue(mockResponseLimit);

      const result = await driverService.checkResponseLimit(mockEstimateRequestId, mockDriverId);

      expect(result).toEqual(mockResponseLimit);
    });

    test("지정 견적 요청에서 응답 가능한 경우", async () => {
      const mockResponseLimit = {
        canRespond: true,
        limit: 2,
        currentCount: 1,
        message: "응답 가능합니다."
      };

      mockDriverRepository.checkResponseLimit.mockResolvedValue(mockResponseLimit);

      const result = await driverService.checkResponseLimit(mockEstimateRequestId, mockDriverId);

      expect(result).toEqual(mockResponseLimit);
    });

    test("지정 견적 요청에서 응답 제한을 초과한 경우", async () => {
      const mockResponseLimit = {
        canRespond: false,
        limit: 2,
        currentCount: 2,
        message: "지정된 모든 기사님이 응답하셨습니다."
      };

      mockDriverRepository.checkResponseLimit.mockResolvedValue(mockResponseLimit);

      const result = await driverService.checkResponseLimit(mockEstimateRequestId, mockDriverId);

      expect(result).toEqual(mockResponseLimit);
    });
  });
});
