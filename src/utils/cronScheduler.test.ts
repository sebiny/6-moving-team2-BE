import { jest } from "@jest/globals";
import { initializeCronJobs, cron } from "./cronScheduler";

// node-cron 모킹
jest.mock("node-cron", () => ({
  schedule: jest.fn()
}));

describe("cronScheduler", () => {
  beforeEach(() => {
    // 각 테스트 전에 모킹 초기화
    jest.clearAllMocks();
  });

  describe("initializeCronJobs", () => {
    it("테스트 환경에서는 cron 스케줄러를 실행하지 않아야 한다", () => {
      // 테스트 환경 설정
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "test";

      // 함수 실행
      initializeCronJobs();

      // cron.schedule이 호출되지 않았는지 확인
      expect(cron.schedule).not.toHaveBeenCalled();

      // 환경 변수 복원
      process.env.NODE_ENV = originalEnv;
    });

    it("개발 환경에서는 cron 스케줄러를 실행해야 한다", () => {
      // 개발 환경 설정
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      // 함수 실행
      initializeCronJobs();

      // cron.schedule이 2번 호출되었는지 확인 (이사 알림 + 견적 완료)
      expect(cron.schedule).toHaveBeenCalledTimes(2);

      // 환경 변수 복원
      process.env.NODE_ENV = originalEnv;
    });
  });
});
