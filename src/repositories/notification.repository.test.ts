import notificationRepository from "./notification.repository";
import prisma from "../config/prisma";
import { Notification, NotificationType } from "@prisma/client";

// prisma.notification 객체 모킹 준비
jest.mock("../config/prisma", () => ({
  notification: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn()
  }
}));

describe("Notification Repository", () => {
  const mockNotification: Notification = {
    id: "notif-id-123",
    message: "테스트 메시지",
    type: "ESTIMATE_ACCEPTED", // 실제 프로젝트에 맞게 타입 맞춰주세요
    isRead: false,
    path: "",
    senderId: "user-sender",
    receiverId: "user-receiver",
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createNotification", () => {
    it("새 알림을 생성한다", async () => {
      (prisma.notification.create as jest.Mock).mockResolvedValue(mockNotification);

      const data = {
        message: "테스트 생성 메시지",
        type: "ESTIMATE_ACCEPTED" as NotificationType,
        senderId: "user1",
        receiverId: "user2",
        isRead: false,
        path: ""
      };

      const result = await notificationRepository.createNotification(data);

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          message: data.message,
          type: data.type,
          isRead: false,
          path: "",
          receiverId: data.receiverId,
          senderId: data.senderId
        }
      });

      expect(result).toEqual(mockNotification);
    });
  });

  describe("getAllNotificationsWithDirection", () => {
    it("사용자 id로 모든 알림을 direction 포함하여 조회한다", async () => {
      const userId = "user1";

      const dbNotifications = [
        { ...mockNotification, receiverId: userId, senderId: "otherUser" },
        { ...mockNotification, id: "2", receiverId: "otherUser", senderId: userId }
      ];

      (prisma.notification.findMany as jest.Mock).mockResolvedValue(dbNotifications);

      const result = await notificationRepository.getAllNotificationsWithDirection(userId);

      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: {
          OR: [{ senderId: userId }, { receiverId: userId }]
        },
        orderBy: { createdAt: "desc" }
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ direction: "received" });
      expect(result[1]).toMatchObject({ direction: "sent" });
    });
  });

  describe("getReceivedNotifications", () => {
    it("특정 사용자가 받은 알림을 최신순으로 반환한다", async () => {
      const userId = "userReceiver";

      const receivedNotis = [
        mockNotification,
        { ...mockNotification, id: "2", receiverId: userId, senderId: "sender2" }
      ];

      (prisma.notification.findMany as jest.Mock).mockResolvedValue(receivedNotis);

      const result = await notificationRepository.getReceivedNotifications(userId);

      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { receiverId: userId },
        orderBy: { createdAt: "desc" }
      });

      expect(result).toEqual(receivedNotis);
    });
  });

  describe("getNotificationById", () => {
    it("알림 id로 특정 알림을 조회한다", async () => {
      const id = mockNotification.id;

      (prisma.notification.findUnique as jest.Mock).mockResolvedValue(mockNotification);

      const result = await notificationRepository.getNotificationById(id);

      expect(prisma.notification.findUnique).toHaveBeenCalledWith({ where: { id } });
      expect(result).toEqual(mockNotification);
    });
  });

  describe("markAsReadNotification", () => {
    it("알림 id로 isRead를 true로 업데이트한다", async () => {
      const id = mockNotification.id;

      const updatedNotification = { ...mockNotification, isRead: true };

      (prisma.notification.update as jest.Mock).mockResolvedValue(updatedNotification);

      const result = await notificationRepository.markAsReadNotification(id);

      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id },
        data: { isRead: true }
      });

      expect(result).toEqual(updatedNotification);
    });
  });

  describe("markAllAsRead", () => {
    it("특정 사용자의 모든 알림을 읽음 처리한다", async () => {
      const userId = "userReceiver";

      const mockUpdateResult = { count: 3 };

      (prisma.notification.updateMany as jest.Mock).mockResolvedValue(mockUpdateResult);

      const result = await notificationRepository.markAllAsRead(userId);

      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { receiverId: userId, isRead: false },
        data: { isRead: true }
      });

      expect(result).toEqual(mockUpdateResult);
    });
  });

  describe("findById", () => {
    it("알림 id로 알림 객체를 조회한다", async () => {
      const id = mockNotification.id;

      (prisma.notification.findUnique as jest.Mock).mockResolvedValue(mockNotification);

      const result = await notificationRepository.findById(id);

      expect(prisma.notification.findUnique).toHaveBeenCalledWith({ where: { id } });
      expect(result).toEqual(mockNotification);
    });
  });

  describe("markAsRead", () => {
    it("특정 알림 id를 읽음 처리한다", async () => {
      const id = mockNotification.id;
      const updated = { ...mockNotification, isRead: true };

      (prisma.notification.update as jest.Mock).mockResolvedValue(updated);

      const result = await notificationRepository.markAsRead(id);

      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id },
        data: { isRead: true }
      });
      expect(result).toEqual(updated);
    });
  });
});
