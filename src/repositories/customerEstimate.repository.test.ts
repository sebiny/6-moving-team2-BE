import { RequestStatus } from "@prisma/client";
import customerEstimateRepository from "./customerEstimate.repository";
import prisma from "../config/prisma";

// Prisma 모킹
jest.mock("../config/prisma", () => ({
  estimateRequest: {
    findMany: jest.fn()
  },
  estimate: {
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    findMany: jest.fn()
  },
  $transaction: jest.fn(),
  customer: {
    findUnique: jest.fn()
  }
}));

describe("customerEstimate.repository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getPendingEstimatesByCustomerId", () => {
    it("대기 중인 견적이 없으면 빈 결과를 반환해야 한다", async () => {
      (prisma.estimateRequest.findMany as jest.Mock).mockResolvedValue([]);

      const result = await customerEstimateRepository.getPendingEstimatesByCustomerId("cust123");

      expect(result).toEqual({
        estimateRequest: null,
        estimates: []
      });
      expect(prisma.estimateRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            customerId: "cust123",
            status: RequestStatus.PENDING
          })
        })
      );
    });

    it("견적 요청과 견적 리스트를 반환해야 한다", async () => {
      (prisma.estimateRequest.findMany as jest.Mock).mockResolvedValue([
        {
          id: "req1",
          moveDate: "2025-08-01",
          moveType: "HOME",
          createdAt: "2025-07-20",
          fromAddress: { region: "서울", district: "강남" },
          toAddress: { region: "부산", district: "해운대" },
          designatedDrivers: [{ driverId: "driver123" }],
          estimates: [
            {
              id: "est1",
              driverId: "driver123",
              driver: {
                reviewsReceived: [{ rating: 5 }],
                favorite: [{}, {}],
                career: 5,
                work: 100,
                authUser: {}
              }
            }
          ]
        }
      ]);

      const result = await customerEstimateRepository.getPendingEstimatesByCustomerId("cust123");

      expect(result.estimateRequest?.id).toBe("req1");
      expect(result.estimates.length).toBe(1);
    });
  });

  describe("acceptEstimateById", () => {
    it("견적이 없으면 에러를 던진다", async () => {
      (prisma.estimate.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(customerEstimateRepository.acceptEstimateById("est999")).rejects.toThrow(
        "해당 견적서를 찾을 수 없습니다."
      );
    });

    it("견적을 정상적으로 확정한다", async () => {
      const mockEstimate = {
        id: "est1",
        deletedAt: null,
        estimateRequestId: "req1",
        estimateRequest: {}
      };
      (prisma.estimate.findUnique as jest.Mock).mockResolvedValue(mockEstimate);

      (prisma.$transaction as jest.Mock).mockImplementation(async (fn) => {
        return fn({
          estimate: {
            update: jest.fn(),
            updateMany: jest.fn()
          },
          estimateRequest: {
            update: jest.fn()
          }
        });
      });

      const result = await customerEstimateRepository.acceptEstimateById("est1");

      expect(result).toEqual({ success: true, estimateId: "est1" });
      expect(prisma.estimate.findUnique).toHaveBeenCalled();
    });
  });

  describe("getCustomerNameById", () => {
    it("고객 이름을 반환한다", async () => {
      (prisma.customer.findUnique as jest.Mock).mockResolvedValue({
        authUser: { name: "홍길동" }
      });

      const result = await customerEstimateRepository.getCustomerNameById("cust123");
      expect(result).toBe("홍길동");
    });

    it("고객이 없으면 null을 반환한다", async () => {
      (prisma.customer.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await customerEstimateRepository.getCustomerNameById("cust123");
      expect(result).toBeNull();
    });
  });
});
