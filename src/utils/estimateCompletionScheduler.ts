import EstimateCompletionService from "../services/estimateCompletion.service";

export class EstimateCompletionScheduler {
  private static isRunning = false;

  /**
   * 완료된 견적들을 배치로 업데이트
   */
  static async runBatchUpdate() {
    // 이미 실행 중이면 스킵
    if (this.isRunning) {
      console.log("견적 완료 스케줄러가 이미 실행 중입니다.");
      return;
    }

    this.isRunning = true;
    console.log("견적 완료 스케줄러 시작:", new Date().toISOString());

    try {
      const totalUpdated = await EstimateCompletionService.processAllBatches();

      if (totalUpdated > 0) {
        console.log(`견적 완료 스케줄러 완료: 총 ${totalUpdated}개 업데이트`);
      } else {
        console.log("견적 완료 스케줄러 완료: 업데이트할 데이터가 없습니다.");
      }
    } catch (error) {
      console.error("견적 완료 스케줄러 오류:", error);
    } finally {
      this.isRunning = false;
    }
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
      isRunning: this.isRunning
    };
  }
}

// 스케줄러 시작 함수 (NodeCron 사용)
export function startEstimateCompletionScheduler() {
  console.log("견적 완료 스케줄러 시작됨");

  // 서버 시작 시 즉시 한 번 실행 (누락된 데이터 처리)
  setTimeout(() => {
    EstimateCompletionScheduler.runBatchUpdate();
  }, 5000); // 서버 시작 5초 후 실행
}
