import cron from "node-cron";
import notificationService from "../services/notification.service";
import prisma from "../config/prisma";

// 00:00:00 - 당일 이사 중 ACCEPTED인 Estimate 수집
cron.schedule("0 0 * * *", async () => {
  const today = new Date().toISOString().slice(0, 10);

  const estimates = await prisma.estimate.findMany({
    where: {
      status: "ACCEPTED",
      estimateRequest: { moveDate: today }
    },
    include: {
      driver: true,
      estimateRequest: true
    }
  });

  for (const estimate of estimates) {
    // 고객, 기사 등 관련자에게 알림 전송
    await notificationService.createMoveDayReminderNotification({
      customerId: estimate.estimateRequest.customerId,
      driverId: estimate.driverId,
      fromAddressId: estimate.estimateRequest.fromAddressId,
      toAddressId: estimate.estimateRequest.toAddressId
    });
  }
});
