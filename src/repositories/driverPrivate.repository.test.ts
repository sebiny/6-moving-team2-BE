import prisma from "../config/prisma";
import driverRepository from "./driver.repository";

jest.mock("../config/prisma", () => ({
  estimateRequest: {
    findMany: jest.fn(),
    findFirst: jest.fn()
  },
  estimate: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  },
  driverEstimateRejection: {
    findMany: jest.fn(),
    count: jest.fn()
  },
  designatedDriver: {
    findMany: jest.fn()
  },
  driverServiceArea: {
    findMany: jest.fn()
  },
  driver: {
    update: jest.fn()
  },
  $transaction: jest.fn()
}));

describe("Driver Repository - Private Functions", () => {
  const mockDriverId = "d1";
  const mockEstimateRequestId = "req1";
  const mockEstimateId = "est1";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getDesignatedEstimateRequests - 지정 견적 요청 조회", () => {
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
      ];
      const mockRejections: any[] = [];
      const mockEstimates: any[] = [];

      (prisma.estimateRequest.findMany as jest.Mock).mockResolvedValue(mockRequests);
      (prisma.driverEstimateRejection.findMany as jest.Mock).mockResolvedValue(mockRejections);
      (prisma.estimate.findMany as jest.Mock).mockResolvedValue(mockEstimates);

      const result = await driverRepository.getDesignatedEstimateRequests(mockDriverId);

      expect(prisma.estimateRequest.findMany).toHaveBeenCalledWith({
        where: {
          designatedDrivers: { some: { driverId: mockDriverId } },
          status: "PENDING",
          deletedAt: null
        },
        include: {
          customer: {
            include: {
              authUser: { select: { name: true } }
            }
          },
          fromAddress: true,
          toAddress: true,
          _count: { select: { estimates: true } }
        }
      });
      expect(result).toEqual([
        {
          ...mockRequests[0],
          isDesignated: true,
          estimateCount: 2
        }
      ]);
    });

    test("반려하거나 응답한 견적 요청은 제외된다", async () => {
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
        },
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
      ];
      const mockRejections = [{ estimateRequestId: "req1" }];
      const mockEstimates = [{ estimateRequestId: "req2" }];

      (prisma.estimateRequest.findMany as jest.Mock).mockResolvedValue(mockRequests);
      (prisma.driverEstimateRejection.findMany as jest.Mock).mockResolvedValue(mockRejections);
      (prisma.estimate.findMany as jest.Mock).mockResolvedValue(mockEstimates);

      const result = await driverRepository.getDesignatedEstimateRequests(mockDriverId);

      expect(result).toEqual([]);
    });
  });

  describe("getAvailableEstimateRequests - 일반 견적 요청 조회", () => {
    test("기사 서비스 지역의 일반 견적 요청을 성공적으로 조회한다", async () => {
      const mockServiceAreas = [
        { driverId: "d1", region: "SEOUL" },
        { driverId: "d1", region: "GYEONGGI" }
      ];
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
      ];
      const mockEstimates: any[] = [];
      const mockRejections: any[] = [];

      (prisma.driverServiceArea.findMany as jest.Mock).mockResolvedValue(mockServiceAreas);
      (prisma.estimateRequest.findMany as jest.Mock).mockResolvedValue(mockRequests);
      (prisma.estimate.findMany as jest.Mock).mockResolvedValue(mockEstimates);
      (prisma.driverEstimateRejection.findMany as jest.Mock).mockResolvedValue(mockRejections);

      const result = await driverRepository.getAvailableEstimateRequests(mockDriverId);

      expect(prisma.driverServiceArea.findMany).toHaveBeenCalledWith({
        where: { driverId: mockDriverId }
      });
      expect(result).toEqual([
        {
          ...mockRequests[0],
          isDesignated: false,
          estimateCount: 1
        }
      ]);
    });

    test("서비스 가능 지역이 없으면 빈 배열을 반환한다", async () => {
      (prisma.driverServiceArea.findMany as jest.Mock).mockResolvedValue([]);

      const result = await driverRepository.getAvailableEstimateRequests(mockDriverId);

      expect(result).toEqual([]);
    });
  });

  describe("getAllEstimateRequests - 모든 견적 요청 조회", () => {
    test("지정 견적과 일반 견적을 모두 조회하여 합친다", async () => {
      const mockServiceAreas = [
        { driverId: "d1", region: "SEOUL" },
        { driverId: "d1", region: "GYEONGGI" }
      ];
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
      ];
      const mockRejections: any[] = [];
      const mockEstimates: any[] = [];

      (prisma.driverServiceArea.findMany as jest.Mock).mockResolvedValue(mockServiceAreas);
      (prisma.estimateRequest.findMany as jest.Mock).mockResolvedValue(mockRequests);
      (prisma.driverEstimateRejection.findMany as jest.Mock).mockResolvedValue(mockRejections);
      (prisma.estimate.findMany as jest.Mock).mockResolvedValue(mockEstimates);

      const result = await driverRepository.getAllEstimateRequests(mockDriverId);

      expect(prisma.estimateRequest.findMany).toHaveBeenCalled();
      expect(result.length).toBeGreaterThan(0);
      expect(result.some((item) => item.isDesignated === true)).toBe(true);
      expect(result.some((item) => item.isDesignated === false)).toBe(true);
    });
  });

  describe("findEstimateByDriverAndRequest - 특정 견적 조회", () => {
    test("기사가 특정 견적 요청에 대해 보낸 견적을 성공적으로 조회한다", async () => {
      const mockEstimate = {
        id: "est1",
        driverId: "d1",
        estimateRequestId: "req1",
        price: 50000,
        comment: "견적서입니다",
        status: "PENDING",
        createdAt: new Date("2025-07-30")
      };

      (prisma.estimate.findFirst as jest.Mock).mockResolvedValue(mockEstimate);

      const result = await driverRepository.findEstimateByDriverAndRequest(mockDriverId, mockEstimateRequestId);

      expect(prisma.estimate.findFirst).toHaveBeenCalledWith({
        where: {
          driverId: mockDriverId,
          estimateRequestId: mockEstimateRequestId,
          deletedAt: null
        }
      });
      expect(result).toEqual(mockEstimate);
    });

    test("견적이 존재하지 않으면 null을 반환한다", async () => {
      (prisma.estimate.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await driverRepository.findEstimateByDriverAndRequest(mockDriverId, mockEstimateRequestId);

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

    test("일반 견적 요청에 대해 견적을 성공적으로 생성한다", async () => {
      const mockCreatedEstimate = {
        id: "est1",
        driverId: "d1",
        estimateRequestId: "req1",
        price: 50000,
        comment: "견적서입니다",
        status: "PENDING",
        createdAt: new Date("2025-07-30")
      };

      (prisma.designatedDriver.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.estimate.count as jest.Mock).mockResolvedValue(3);
      (prisma.estimate.create as jest.Mock).mockResolvedValue(mockCreatedEstimate);
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback({
          designatedDriver: { findMany: jest.fn().mockResolvedValue([]) },
          estimate: { count: jest.fn().mockResolvedValue(3), create: jest.fn().mockResolvedValue(mockCreatedEstimate) }
        });
      });

      const result = await driverRepository.createEstimate(mockEstimateData);

      expect(result).toEqual(mockCreatedEstimate);
    });

    test("지정 견적 요청에서 응답 제한을 초과하면 오류를 발생시킨다", async () => {
      const mockDesignatedDrivers = [{ driverId: "d1" }, { driverId: "d2" }];

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback({
          designatedDriver: { findMany: jest.fn().mockResolvedValue(mockDesignatedDrivers) },
          estimate: { count: jest.fn().mockResolvedValue(2) },
          driverEstimateRejection: { count: jest.fn().mockResolvedValue(1) }
        });
      });

      await expect(driverRepository.createEstimate(mockEstimateData)).rejects.toThrow(
        "지정된 모든 기사님이 응답하셨습니다."
      );
    });

    test("일반 견적 요청에서 응답 제한을 초과하면 오류를 발생시킨다", async () => {
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback({
          designatedDriver: { findMany: jest.fn().mockResolvedValue([]) },
          estimate: { count: jest.fn().mockResolvedValue(5) }
        });
      });

      await expect(driverRepository.createEstimate(mockEstimateData)).rejects.toThrow(
        "이미 최대 응답 가능 기사님 수를 초과했습니다."
      );
    });
  });

  describe("rejectEstimate - 견적 거절", () => {
    test("견적을 성공적으로 거절 처리한다", async () => {
      const mockRejectedEstimate = {
        id: "est1",
        driverId: "d1",
        estimateRequestId: "req1",
        price: 50000,
        comment: "견적서입니다",
        status: "REJECTED",
        rejectReason: "일정이 맞지 않습니다",
        updatedAt: new Date("2025-07-30")
      };

      (prisma.estimate.update as jest.Mock).mockResolvedValue(mockRejectedEstimate);

      const result = await driverRepository.rejectEstimate(mockEstimateId, "일정이 맞지 않습니다");

      expect(prisma.estimate.update).toHaveBeenCalledWith({
        where: { id: mockEstimateId },
        data: {
          status: "REJECTED",
          rejectReason: "일정이 맞지 않습니다"
        }
      });
      expect(result).toEqual(mockRejectedEstimate);
    });
  });

  describe("getMyEstimates - 내 견적 목록 조회", () => {
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
      ];

      (prisma.estimate.findMany as jest.Mock).mockResolvedValue(mockEstimates);

      const result = await driverRepository.getMyEstimates(mockDriverId);

      expect(prisma.estimate.findMany).toHaveBeenCalledWith({
        where: { driverId: mockDriverId, deletedAt: null },
        include: {
          estimateRequest: {
            include: {
              customer: {
                include: {
                  authUser: { select: { name: true } }
                }
              },
              fromAddress: true,
              toAddress: true
            }
          }
        },
        orderBy: { createdAt: "desc" }
      });

      // 실제 함수가 추가하는 필드들을 포함하여 검증
      expect(result[0]).toMatchObject({
        id: "est1",
        driverId: "d1",
        estimateRequestId: "req1",
        price: 50000,
        comment: "견적서입니다",
        status: "PENDING",
        createdAt: new Date("2025-07-30"),
        customerName: "고객1",
        isCompleted: false,
        isDesignated: undefined,
        completionStatus: null
      });
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
      };

      (prisma.estimate.findFirst as jest.Mock).mockResolvedValue(mockEstimateDetail);

      const result = await driverRepository.getEstimateDetail(mockDriverId, mockEstimateId);

      expect(prisma.estimate.findFirst).toHaveBeenCalledWith({
        where: { id: mockEstimateId, driverId: mockDriverId, deletedAt: null },
        include: {
          estimateRequest: {
            include: {
              customer: {
                include: {
                  authUser: { select: { name: true } }
                }
              },
              fromAddress: true,
              toAddress: true
            }
          }
        }
      });
      expect(result).toEqual(mockEstimateDetail);
    });

    test("견적이 존재하지 않으면 null을 반환한다", async () => {
      (prisma.estimate.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await driverRepository.getEstimateDetail(mockDriverId, mockEstimateId);

      expect(result).toBeNull();
    });
  });

  describe("getRejectedEstimateRequests - 거절한 견적 요청 조회", () => {
    test("기사가 거절한 견적 요청 목록을 최신순으로 조회한다", async () => {
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
            designatedDrivers: []
          }
        }
      ];

      (prisma.driverEstimateRejection.findMany as jest.Mock).mockResolvedValue(mockRejections);

      const result = await driverRepository.getRejectedEstimateRequests(mockDriverId);

      expect(prisma.driverEstimateRejection.findMany).toHaveBeenCalledWith({
        where: { driverId: mockDriverId },
        include: {
          estimateRequest: {
            include: {
              customer: {
                include: {
                  authUser: { select: { name: true } }
                }
              },
              fromAddress: true,
              toAddress: true,
              designatedDrivers: true
            }
          }
        },
        orderBy: { createdAt: "desc" }
      });

      // 실제 함수가 추가하는 필드들을 포함하여 검증
      expect(result[0]).toMatchObject({
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
      });
    });
  });

  describe("checkResponseLimit - 응답 제한 확인", () => {
    test("일반 견적 요청에서 응답 가능한 경우", async () => {
      (prisma.designatedDriver.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.estimate.count as jest.Mock).mockResolvedValue(3);

      const result = await driverRepository.checkResponseLimit(mockEstimateRequestId, mockDriverId);

      expect(result).toEqual({
        canRespond: true,
        limit: 5,
        currentCount: 3,
        message: "응답 가능합니다."
      });
    });

    test("일반 견적 요청에서 응답 제한을 초과한 경우", async () => {
      (prisma.designatedDriver.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.estimate.count as jest.Mock).mockResolvedValue(5);

      const result = await driverRepository.checkResponseLimit(mockEstimateRequestId, mockDriverId);

      expect(result).toEqual({
        canRespond: false,
        limit: 5,
        currentCount: 5,
        message: "이미 최대 응답 가능 기사님 수를 초과했습니다."
      });
    });

    test("지정 견적 요청에서 응답 가능한 경우", async () => {
      const mockDesignatedDrivers = [{ driverId: "d1" }, { driverId: "d2" }];

      (prisma.designatedDriver.findMany as jest.Mock).mockResolvedValue(mockDesignatedDrivers);
      (prisma.estimate.count as jest.Mock).mockResolvedValue(1);
      (prisma.driverEstimateRejection.count as jest.Mock).mockResolvedValue(0);

      const result = await driverRepository.checkResponseLimit(mockEstimateRequestId, mockDriverId);

      expect(result).toEqual({
        canRespond: true,
        limit: 2,
        currentCount: 1,
        message: "응답 가능합니다."
      });
    });

    test("지정 견적 요청에서 응답 제한을 초과한 경우", async () => {
      const mockDesignatedDrivers = [{ driverId: "d1" }, { driverId: "d2" }];

      (prisma.designatedDriver.findMany as jest.Mock).mockResolvedValue(mockDesignatedDrivers);
      (prisma.estimate.count as jest.Mock).mockResolvedValue(1);
      (prisma.driverEstimateRejection.count as jest.Mock).mockResolvedValue(1);

      const result = await driverRepository.checkResponseLimit(mockEstimateRequestId, mockDriverId);

      expect(result).toEqual({
        canRespond: false,
        limit: 2,
        currentCount: 2,
        message: "지정된 모든 기사님이 응답하셨습니다."
      });
    });
  });
});
