import notificationService from "../services/notification.service";
import prisma from "../config/prisma";

export const sendMoveDayReminders = async () => {
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
    await notificationService.createMoveDayReminderNotification({
      customerId: estimate.estimateRequest.customerId,
      driverId: estimate.driverId,
      fromAddressId: estimate.estimateRequest.fromAddressId,
      toAddressId: estimate.estimateRequest.toAddressId
    });
  }

  return estimates.length;
};
