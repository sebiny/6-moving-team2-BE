import prisma from "../config/prisma";
import estimateReqRepository from "../repositories/estimateReq.repository";

jest.mock("../config/prisma", () => ({
  customerAddress: {
    create: jest.fn(),
    findMany: jest.fn()
  },
  estimateRequest: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn()
  },
  designatedDriver: {
    count: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn()
  },
  driverEstimateRejection: {
    findUnique: jest.fn(),
    create: jest.fn(),
    count: jest.fn()
  },
  $transaction: jest.fn((cb) => cb(prisma))
}));

describe("EstimateReq Repository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("linkCustomerAddress - 고객 주소 연결", () => {
    test("입력한 정보로 고객 주소를 연결하고 연결된 객체를 반환한다", async () => {
      const mockResult = { id: "link-1" };
      (prisma.customerAddress.create as jest.Mock).mockResolvedValue(mockResult);

      const result = await estimateReqRepository.linkCustomerAddress({
        customerId: "cust-1",
        addressId: "addr-1",
        role: "FROM"
      });

      expect(result).toEqual(mockResult);
    });
  });

  describe("getCustomerAddressesByRole - 고객 주소 목록 조회", () => {
    test("고객 ID와 역할로 주소 목록을 조회하고 결과를 반환한다", async () => {
      const mockResult = [{ id: "ca-1" }];
      (prisma.customerAddress.findMany as jest.Mock).mockResolvedValue(mockResult);

      const result = await estimateReqRepository.getCustomerAddressesByRole("cust-1", "FROM");

      expect(result).toEqual(mockResult);
    });
  });

  describe("createEstimateRequest - 일반 견적 요청 생성", () => {
    test("입력한 정보로 견적 요청을 생성하고 결과를 반환한다", async () => {
      const mockResult = { id: "req-1" };
      (prisma.estimateRequest.create as jest.Mock).mockResolvedValue(mockResult);

      const result = await estimateReqRepository.createEstimateRequest({
        customerId: "cust-1",
        moveType: "HOME",
        moveDate: new Date("2025-08-01"),
        fromAddressId: "addr-1",
        toAddressId: "addr-2",
        status: "PENDING"
      });

      expect(result).toEqual(mockResult);
    });
  });

  describe("findActiveEstimateRequest - 활성 견적 요청 조회", () => {
    test("고객 ID로 활성 견적 요청을 조회하고 결과를 반환한다", async () => {
      const mockResult = { id: "active-req" };
      (prisma.estimateRequest.findFirst as jest.Mock).mockResolvedValue(mockResult);

      const result = await estimateReqRepository.findActiveEstimateRequest("cust-1");

      expect(result).toEqual(mockResult);
    });
  });

  describe("getDesignatedDriverCount - 지정 기사 수 조회", () => {
    test("요청 ID로 지정된 기사 수를 조회하고 결과를 반환한다", async () => {
      (prisma.designatedDriver.count as jest.Mock).mockResolvedValue(3);

      const result = await estimateReqRepository.getDesignatedDriverCount("req-1");

      expect(result).toBe(3);
    });
  });

  describe("createDesignatedDriver - 지정 기사 요청", () => {
    test("요청 ID와 기사 ID로 지정 기사에게 요청하고 결과를 반환한다", async () => {
      const mockResult = { id: "d-1" };
      (prisma.designatedDriver.create as jest.Mock).mockResolvedValue(mockResult);

      const result = await estimateReqRepository.createDesignatedDriver("req-1", "drv-1");

      expect(result).toEqual(mockResult);
    });
  });
});
