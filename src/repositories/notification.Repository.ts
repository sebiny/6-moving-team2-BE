import prisma from "../config/prisma"; // Prisma 클라이언트 import
import { $Enums, Notification } from "@prisma/client";
import { CreateNotificationData } from "../types/notification.type";

// 알림 데이터베이스 작업을 담당하는 객체
/**
 * 새로운 알림을 데이터베이스에 생성합니다.
 * @param data - 생성할 알림 정보
 * @returns 생성된 알림 객체
 */
async function createNotification(data: CreateNotificationData): Promise<Notification> {
  return prisma.notification.create({
    data: {
      message: data.message,
      type: data.type,
      isRead: false,
      path: "",
      receiverId: data.receiverId,
      senderId: data.senderId
    }
  });
}

/**
 * 특정 사용자의 모든 알림을 최신순으로 조회합니다.
 * @param userId - 사용자 ID
 * @returns 알림 목록
 */

type NotificationWithDirection = Notification & { direction: "received" | "sent" };

async function getAllNotificationsWithDirection(userId: string): Promise<NotificationWithDirection[]> {
  const notifications = await prisma.notification.findMany({
    where: {
      OR: [{ senderId: userId }, { receiverId: userId }]
    },
    orderBy: { createdAt: "desc" }
  });

  return notifications.map((noti) => ({
    ...noti,
    direction: noti.receiverId === userId ? "received" : "sent" // OK!
  }));
}

/**
 * 특정 사용자가 받은 모든 알림을 최신순으로 가져옵니다.
 * @param userId 사용자 ID
 * @returns 받은 알림 목록 (Notification 배열)
 */
async function getReceivedNotifications(userId: string): Promise<Notification[]> {
  const receivedNotifications = await prisma.notification.findMany({
    // 이 부분이 핵심입니다! OR 조건을 제거하고 receiverId만 남깁니다.
    where: {
      receiverId: userId
    },
    orderBy: {
      createdAt: "desc" // 최신순 정렬은 그대로 유지
    }
  });

  // '받은' 알림만 가져왔으므로 별도의 가공 없이 바로 반환합니다.
  return receivedNotifications;
}

/* 특정 알림 조회 */
async function getNotificationById(id: string) {
  return await prisma.notification.findUnique({
    where: { id }
  });
}

/**
 * 특정 알림을 읽음 처리합니다.
 * @param notificationId - 알림 ID
 * @returns 업데이트된 알림 객체
 */
async function markAsReadNotification(notificationId: string): Promise<Notification> {
  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true }
  });
}

/**
 * 특정 사용자의 모든 알림을 읽음 처리합니다.
 * @param userId - 사용자 ID
 * @returns 업데이트 작업 정보
 */
async function markAllAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { receiverId: userId, isRead: false },
    data: { isRead: true }
  });
}

/**
 * 특정 알림을 삭제합니다.
 * @param notificationId - 알림 ID
 */
// async function deleteNotification(notificationId: string): Promise<void> {
//   await prisma.notification.delete({
//     where: { id: notificationId }
//   });
// }

/**
 * 특정 알림의 소유자를 확인하기 위해 알림 정보를 조회합니다.
 * @param notificationId - 알림 ID
 * @returns 알림 객체 또는 null
 */
async function findById(id: string): Promise<Notification | null> {
  return prisma.notification.findUnique({
    where: { id: id }
  });
}

async function markAsRead(id: string): Promise<Notification> {
  return prisma.notification.update({
    where: {
      id: id // 어떤 레코드를 업데이트할지 지정
    },
    data: {
      isRead: true // 어떤 데이터를 변경할지 지정
    }
  });
}

export default {
  createNotification,
  getAllNotificationsWithDirection,
  markAsReadNotification,
  getNotificationById,
  markAllAsRead,
  markAsRead,
  findById,
  getReceivedNotifications
};
