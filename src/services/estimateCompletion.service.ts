import prisma from "../config/prisma";

interface BatchResult {
  estimateCount: number;
  requestCount: number;
}

/**
 * 견적 완료 처리 서비스
 */
class EstimateCompletionService {
  private static readonly BATCH_SIZE = 100;

  /**
   * 배치 단위로 완료 처리
   */
  static async processBatch(currentDate: Date): Promise<BatchResult> {
    return await prisma.$transaction(async (tx) => {
      // 1. 완료할 견적 요청들 찾기 (APPROVED 또는 PENDING 상태)
      const requestsToUpdate = await tx.estimateRequest.findMany({
        where: {
          status: { in: ["APPROVED", "PENDING"] },
          moveDate: { lt: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()) }, // 오늘 자정 이전
          deletedAt: null
        },
        select: {
          id: true,
          moveDate: true,
          status: true
        },
        take: this.BATCH_SIZE
      });

      if (requestsToUpdate.length === 0) {
        return { estimateCount: 0, requestCount: 0 };
      }

      console.log(`🔍 처리할 견적 요청들:`);
      requestsToUpdate.forEach((req, index) => {
        console.log(`  ${index + 1}. ID: ${req.id}, 날짜: ${req.moveDate.toLocaleDateString()}, 상태: ${req.status}`);
      });

      const requestIds = requestsToUpdate.map((r) => r.id);

      // 2. 견적 요청 상태를 COMPLETED로 업데이트
      const requestResult = await tx.estimateRequest.updateMany({
        where: {
          id: { in: requestIds },
          status: { in: ["APPROVED", "PENDING"] } // 중복 업데이트 방지
        },
        data: { status: "COMPLETED" }
      });

      return {
        estimateCount: 0, // 견적 상태는 변경하지 않음
        requestCount: requestResult.count
      };
    });
  }

  /**
   * 전체 배치 처리 실행
   */
  static async processAllBatches(): Promise<number> {
    const currentDate = new Date();
    let totalUpdated = 0;
    let batchCount = 0;

    do {
      const result = await this.processBatch(currentDate);
      totalUpdated += result.estimateCount + result.requestCount;
      batchCount++;

      // 업데이트가 있는 경우에만 대기
      if (result.estimateCount > 0 || result.requestCount > 0) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    } while (batchCount < 10); // 최대 10배치까지만 처리 (안전장치)

    return totalUpdated;
  }

  /**
   * 완료할 견적 요청 개수 조회
   */
  static async getPendingCompletionCount(): Promise<number> {
    const currentDate = new Date();

    return await prisma.estimateRequest.count({
      where: {
        status: { in: ["APPROVED", "PENDING"] },
        moveDate: { lt: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()) }, // 오늘 자정 이전
        deletedAt: null
      }
    });
  }
}

export default EstimateCompletionService;
