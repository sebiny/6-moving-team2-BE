import cron from "node-cron";
import { sendMoveDayReminders } from "./moveReminder";

// 00:00:00 - 당일 이사 중 ACCEPTED인 Estimate 수집
cron.schedule("0 0 * * *", sendMoveDayReminders, {
  timezone: "Asia/Seoul" // 시간대(Timezone)를 명시하는 것이 좋습니다.
});
