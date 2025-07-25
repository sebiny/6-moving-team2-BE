import notificationService from "../services/notification.service";
import prisma from "../config/prisma";

export const sendMoveDayReminders = async () => {
  // 1. '오늘'의 시작과 '내일'의 시작을 Date 객체로 정확히 정의합니다.
  const today = new Date();
  today.setHours(0, 0, 0, 0); // 오늘 0시 0분 0초 (KST 기준)

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1); // 내일 0시 0분 0초

  console.log(`[${new Date().toLocaleString()}] 이사 당일 알림 작업을 시작합니다.`);
  console.log(`조회 범위: ${today.toISOString()} ~ ${tomorrow.toISOString()}`);

  // 2. Prisma 쿼리에서 날짜 비교 방식을 범위로 수정합니다.
  const estimates = await prisma.estimate.findMany({
    where: {
      status: {
        in: ["ACCEPTED"]
      },
      estimateRequest: {
        moveDate: {
          gte: today, // '오늘' 0시 이후 (크거나 같음)
          lt: tomorrow // '내일' 0시 이전 (작음)
        }
      }
    },
    include: {
      driver: true,
      estimateRequest: true
    }
  });

  console.log(`알림 보낼 이사 건수: ${estimates.length}건`);

  for (const estimate of estimates) {
    try {
      await notificationService.createMoveDayReminderNotification({
        customerId: estimate.estimateRequest.customerId,
        driverId: estimate.driverId,
        fromAddressId: estimate.estimateRequest.fromAddressId,
        toAddressId: estimate.estimateRequest.toAddressId
      });
    } catch (error) {
      console.error(`알림 생성 중 에러 발생 (Estimate ID: ${estimate.id}):`, error);
    }
  }

  return estimates.length;
};
