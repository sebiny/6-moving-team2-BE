import cron from "node-cron";
import { sendMoveDayReminders } from "./moveReminder";
import { EstimateCompletionScheduler } from "./estimateCompletionScheduler";

// 테스트 환경에서 모킹을 위해 cron을 export
export { cron };

/**
 * 모든 cron 작업을 초기화하고 시작하는 함수
 */
export function initializeCronJobs() {
  // 테스트 환경에서는 cron 스케줄러를 실행하지 않음
  if (process.env.NODE_ENV === "test") {
    console.log("테스트 환경: Cron 작업 초기화를 건너뜁니다.");
    return;
  }

  console.log("Cron 작업 시작...");

  // 00:00:00 - 당일 이사 중 ACCEPTED인 Estimate 수집
  cron.schedule("0 0 * * *", sendMoveDayReminders, {
    timezone: "Asia/Seoul"
  });

  // 00:05:00 - 견적 완료 처리 (이사 당일 알림 후 5분 뒤 실행)
  cron.schedule(
    "5 0 * * *",
    () => {
      EstimateCompletionScheduler.runBatchUpdate();
    },
    {
      timezone: "Asia/Seoul"
    }
  );

  console.log("Cron 작업 완료");
}

/**
 * 모든 cron 작업을 중지하는 함수
 */
export function stopCronJobs() {
  console.log("Cron 작업 중지...");
  // cron 작업들을 중지하는 로직이 필요하다면 여기에 추가
}
