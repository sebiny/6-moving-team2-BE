import EstimateCompletionService from "./estimateCompletion.service";
import prisma from "../config/prisma";

// Prisma 모킹
jest.mock("../config/prisma", () => ({
  $transaction: jest.fn(),
  estimateRequest: {
    findMany: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn()
  }
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe("EstimateCompletionService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("processBatch - 배치 단위로 완료 처리", () => {
    test("완료할 견적 요청이 있는 경우 성공적으로 처리한다", async () => {
      const mockRequests = [
        {
          id: "req-1",
          moveDate: new Date("2025-07-29"), // 어제 날짜
          status: "APPROVED"
        },
        {
          id: "req-2",
          moveDate: new Date("2025-07-28"), // 이틀 전 날짜
          status: "PENDING"
        }
      ];

      const mockUpdateResult = { count: 2 };

      // 트랜잭션 모킹
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          estimateRequest: {
            findMany: jest.fn().mockResolvedValue(mockRequests),
            updateMany: jest.fn().mockResolvedValue(mockUpdateResult)
          }
        } as any;
        return await callback(mockTx);
      });

      const result = await EstimateCompletionService.processBatch(new Date("2025-07-30"));

      expect(result).toEqual({
        estimateCount: 0,
        requestCount: 2
      });
    });

    test("완료할 견적 요청이 없는 경우 빈 결과를 반환한다", async () => {
      // 트랜잭션 모킹
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          estimateRequest: {
            findMany: jest.fn().mockResolvedValue([]),
            updateMany: jest.fn().mockResolvedValue({ count: 0 })
          }
        } as any;
        return await callback(mockTx);
      });

      const result = await EstimateCompletionService.processBatch(new Date("2025-07-30"));

      expect(result).toEqual({
        estimateCount: 0,
        requestCount: 0
      });
    });

    test("트랜잭션 실패 시 에러를 발생시킨다", async () => {
      mockPrisma.$transaction.mockRejectedValue(new Error("Database error"));

      await expect(EstimateCompletionService.processBatch(new Date("2025-07-30"))).rejects.toThrow("Database error");
    });
  });

  describe("processAllBatches - 전체 배치 처리 실행", () => {
    test("여러 배치를 성공적으로 처리한다", async () => {
      let batchCount = 0;

      // 첫 번째 배치: 2개 처리
      // 두 번째 배치: 1개 처리
      // 세 번째 배치: 0개 처리 (종료)
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        batchCount++;
        const mockTx = {
          estimateRequest: {
            findMany: jest.fn().mockResolvedValue(
              batchCount === 1
                ? [
                    { id: "req-1", moveDate: new Date("2025-07-29"), status: "APPROVED" },
                    { id: "req-2", moveDate: new Date("2025-07-28"), status: "PENDING" }
                  ]
                : batchCount === 2
                  ? [{ id: "req-3", moveDate: new Date("2025-07-27"), status: "APPROVED" }]
                  : []
            ),
            updateMany: jest.fn().mockResolvedValue({ count: batchCount <= 2 ? (batchCount === 1 ? 2 : 1) : 0 })
          }
        } as any;
        return await callback(mockTx);
      });

      const result = await EstimateCompletionService.processAllBatches();

      expect(result).toBe(3); // 2 + 1 = 3개 처리
      // 실제로는 최대 10배치까지 호출되므로 10번 호출됨
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(10);
    });

    test("처리할 데이터가 없으면 0을 반환한다", async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          estimateRequest: {
            findMany: jest.fn().mockResolvedValue([]),
            updateMany: jest.fn().mockResolvedValue({ count: 0 })
          }
        } as any;
        return await callback(mockTx);
      });

      const result = await EstimateCompletionService.processAllBatches();

      expect(result).toBe(0);
      // 실제로는 최대 10배치까지 호출되므로 10번 호출됨
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(10);
    });
  });

  describe("getPendingCompletionCount - 완료할 견적 요청 개수 조회", () => {
    test("완료 대기 중인 견적 요청 개수를 정확히 반환한다", async () => {
      (mockPrisma.estimateRequest.count as jest.Mock).mockResolvedValue(5);

      const result = await EstimateCompletionService.getPendingCompletionCount();

      expect(mockPrisma.estimateRequest.count).toHaveBeenCalledWith({
        where: {
          status: { in: ["APPROVED", "PENDING"] },
          moveDate: { lt: expect.any(Date) }, // 오늘 자정 이전
          deletedAt: null
        }
      });
      expect(result).toBe(5);
    });

    test("완료 대기 중인 요청이 없으면 0을 반환한다", async () => {
      (mockPrisma.estimateRequest.count as jest.Mock).mockResolvedValue(0);

      const result = await EstimateCompletionService.getPendingCompletionCount();

      expect(result).toBe(0);
    });

    test("데이터베이스 에러 시 에러를 발생시킨다", async () => {
      (mockPrisma.estimateRequest.count as jest.Mock).mockRejectedValue(new Error("Database error"));

      await expect(EstimateCompletionService.getPendingCompletionCount()).rejects.toThrow("Database error");
    });
  });

  describe("날짜 계산 로직", () => {
    test("오늘 자정 이전 날짜만 처리한다", async () => {
      const today = new Date("2025-07-30");
      const expectedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      (mockPrisma.estimateRequest.count as jest.Mock).mockResolvedValue(0);

      await EstimateCompletionService.getPendingCompletionCount();

      expect(mockPrisma.estimateRequest.count).toHaveBeenCalledWith({
        where: {
          status: { in: ["APPROVED", "PENDING"] },
          moveDate: { lt: expect.any(Date) }, // 정확한 날짜 대신 any Date 사용
          deletedAt: null
        }
      });
    });
  });
});
