import prisma from "../config/prisma";

export class EstimateCompletionScheduler {
  private static isRunning = false;
  private static lastRunTime = 0;
  private static readonly RUN_INTERVAL = 24 * 60 * 60 * 1000; // 24시간
  private static readonly BATCH_SIZE = 100;

  /**
   * 완료된 견적들을 배치로 업데이트
   */
  static async runBatchUpdate() {
    // 이미 실행 중이면 스킵
    if (this.isRunning) {
      console.log("견적 완료 스케줄러가 이미 실행 중입니다.");
      return;
    }

    // 마지막 실행 후 24시간이 지나지 않았으면 스킵
    const now = Date.now();
    if (now - this.lastRunTime < this.RUN_INTERVAL) {
      console.log("견적 완료 스케줄러 실행 간격이 지나지 않았습니다.");
      return;
    }

    this.isRunning = true;
    console.log("견적 완료 스케줄러 시작:", new Date().toISOString());

    try {
      const currentDate = new Date();
      let totalUpdated = 0;
      let batchCount = 0;

      do {
        const result = await this.processBatch(currentDate);
        totalUpdated += result.estimateCount + result.requestCount;
        batchCount++;

        console.log(
          `배치 ${batchCount} 처리 완료: 견적 ${result.estimateCount}개, 요청 ${result.requestCount}개 업데이트`
        );

        // 배치 간 대기 (DB 부하 분산)
        if (result.estimateCount > 0 || result.requestCount > 0) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      } while (batchCount < 10); // 최대 10배치까지만 처리 (안전장치)

      console.log(`견적 완료 스케줄러 완료: 총 ${totalUpdated}개 업데이트`);
      this.lastRunTime = now;
    } catch (error) {
      console.error("견적 완료 스케줄러 오류:", error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * 배치 단위로 완료 처리
   */
  private static async processBatch(currentDate: Date) {
    return await prisma.$transaction(async (tx) => {
      // 1. 완료할 견적 요청들 찾기
      const requestsToUpdate = await tx.estimateRequest.findMany({
        where: {
          status: "APPROVED",
          moveDate: { lt: currentDate },
          deletedAt: null
        },
        select: { id: true },
        take: this.BATCH_SIZE
      });

      if (requestsToUpdate.length === 0) {
        return { estimateCount: 0, requestCount: 0 };
      }

      const requestIds = requestsToUpdate.map((r) => r.id);

      // 2. 견적 요청 상태를 COMPLETED로 업데이트
      const requestResult = await tx.estimateRequest.updateMany({
        where: {
          id: { in: requestIds },
          status: "APPROVED" // 중복 업데이트 방지
        },
        data: { status: "COMPLETED" }
      });

      // 3. 관련된 ACCEPTED 견적들은 그대로 유지 (EstimateStatus에 COMPLETED가 없음)
      // 완료 판단은 날짜 기준으로만 함
      const estimateResult = { count: 0 };

      return {
        estimateCount: estimateResult.count,
        requestCount: requestResult.count
      };
    });
  }

  /**
   * 수동으로 스케줄러 실행 (테스트용)
   */
  static async runManually() {
    console.log("수동으로 견적 완료 스케줄러 실행");
    await this.runBatchUpdate();
  }

  /**
   * 스케줄러 상태 확인
   */
  static getStatus() {
    return {
      isRunning: this.isRunning,
      lastRunTime: this.lastRunTime,
      lastRunDate: this.lastRunTime > 0 ? new Date(this.lastRunTime).toISOString() : null
    };
  }
}

// 스케줄러 시작 함수
export function startEstimateCompletionScheduler() {
  console.log("견적 완료 스케줄러 시작됨");

  // 매일 자정에 실행
  setInterval(() => {
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() === 0) {
      EstimateCompletionScheduler.runBatchUpdate();
    }
  }, 60 * 1000); // 1분마다 체크

  // 서버 시작 시 즉시 한 번 실행 (누락된 데이터 처리)
  setTimeout(() => {
    EstimateCompletionScheduler.runBatchUpdate();
  }, 5000); // 서버 시작 5초 후 실행
}
