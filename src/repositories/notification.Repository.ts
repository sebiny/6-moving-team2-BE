import prisma from "../config/prisma"; // Prisma 클라이언트 import
import { $Enums, Notification, NotificationType } from "@prisma/client";

// 알림 생성 시 필요한 데이터 타입
type CreateNotificationData = {
  userId: string;
  title: string;
  userName?: string;
  userType?: "DRIVER" | "CUSTOMER" | undefined;
  type: string;
  isRead: boolean;
};

// 알림 데이터베이스 작업을 담당하는 객체
const notificationRepository = {
  /**
   * 새로운 알림을 데이터베이스에 생성합니다.
   * @param data - 생성할 알림 정보
   * @returns 생성된 알림 객체
   */
  async create(data: CreateNotificationData): Promise<Notification> {
    return prisma.notification.create({
      data: {
        title: data.title,
        type: $Enums.NotificationType.MESSAGE,
        isRead: false,
        receiver: {
          connect: {
            id: data.userId
          }
        }
        // ...(data.senderId && {
        //   sender: {
        //     connect: {
        //       id: data.senderId
        //     }
        //   }
        // })
      }
    });
  },

  /**
   * 특정 사용자의 모든 알림을 최신순으로 조회합니다.
   * @param userId - 사용자 ID
   * @returns 알림 목록
   */
  async findAllByUserId(userId: string): Promise<Notification[]> {
    return prisma.notification.findMany({
      where: { receiverId: userId },
      orderBy: { createdAt: "desc" }
    });
  },

  /**
   * 특정 알림을 읽음 처리합니다.
   * @param notificationId - 알림 ID
   * @returns 업데이트된 알림 객체
   */
  async markAsRead(notificationId: string): Promise<Notification> {
    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });
  },

  /**
   * 특정 사용자의 모든 알림을 읽음 처리합니다.
   * @param userId - 사용자 ID
   * @returns 업데이트 작업 정보
   */
  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { receiverId: userId, isRead: false },
      data: { isRead: true }
    });
  },

  /**
   * 특정 알림을 삭제합니다.
   * @param notificationId - 알림 ID
   */
  async delete(notificationId: string): Promise<void> {
    await prisma.notification.delete({
      where: { id: notificationId }
    });
  },

  /**
   * 특정 알림의 소유자를 확인하기 위해 알림 정보를 조회합니다.
   * @param notificationId - 알림 ID
   * @returns 알림 객체 또는 null
   */
  async findById(notificationId: string): Promise<Notification | null> {
    return prisma.notification.findUnique({
      where: { id: notificationId }
    });
  }
};

export default notificationRepository;
