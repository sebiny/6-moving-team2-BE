import notificationService from "./notification.service";
import notificationRepository from "../repositories/notification.repository";
import authRepository from "../repositories/auth.repository";
import addressRepository from "../repositories/address.repository";
import driverRepository from "../repositories/driver.repository";
import { sseEmitters } from "../sse/sseEmitters";
import { MoveType } from "@prisma/client";

jest.mock("../repositories/notification.repository");
jest.mock("../repositories/auth.repository");
jest.mock("../repositories/address.repository");
jest.mock("../repositories/driver.repository");

jest.mock("../sse/sseEmitters", () => ({
  sseEmitters: {}
}));

describe("Notification Service Additional Functions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createEstimateProposalNotification", () => {
    it("고객 알림 생성 및 SSE 이벤트 보내기", async () => {
      const input = {
        driverId: "driver1",
        customerId: "customer1",
        moveType: "소형이사" as MoveType
      };
      const driverUser = { id: input.driverId, name: "기사이름" };
      const customerUser = { id: input.customerId, name: "고객이름" };
      const mockNotification = { id: "notif-prop", message: "견적 알림" };

      (authRepository.findAuthUserProfileById as jest.Mock).mockImplementation(async (id) => {
        if (id === input.driverId) return driverUser;
        if (id === input.customerId) return customerUser;
        return null;
      });

      (notificationRepository.createNotification as jest.Mock).mockResolvedValue(mockNotification);

      const customerEmitter = { write: jest.fn() };
      (sseEmitters as Record<string, any>)[customerUser.id] = customerEmitter;

      await notificationService.createEstimateProposalNotification({
        driverId: "driver1",
        customerId: "customer1",
        moveType: "소형이사" as MoveType
      });

      expect(authRepository.findAuthUserProfileById).toHaveBeenCalledWith(input.customerId);
      expect(authRepository.findAuthUserProfileById).toHaveBeenCalledWith(input.driverId);

      expect(notificationRepository.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          senderId: customerUser.id,
          receiverId: customerUser.id,
          message: expect.any(String),
          isRead: false
        })
      );

      expect(customerEmitter.write).toHaveBeenCalledWith(`data: ${JSON.stringify(mockNotification)}\n\n`);

      delete (sseEmitters as any)[customerUser.id];
    });

    it("고객 정보 없으면 오류 로그 후 종료", async () => {
      const input = {
        driverId: "driver1",
        customerId: "customer1",
        moveType: "소형이사" as MoveType
      };

      (authRepository.findAuthUserProfileById as jest.Mock).mockImplementation(async (id) => {
        if (id === input.driverId) return { id: "driver1", name: "기사이름" };
        return null; // 고객 없음
      });

      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      await notificationService.createEstimateProposalNotification({
        driverId: "driver1",
        customerId: "customer1",
        moveType: "소형이사" as MoveType
      });

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("견적 발송 알림 생성 실패"));
      errorSpy.mockRestore();
    });
  });

  describe("createEstimateConfirmNotification", () => {
    it("고객과 기사 모두에게 알림 전송", async () => {
      const input = {
        driverId: "driver1",
        customerId: "customer1",
        estimateId: "estimate123"
      };

      const customerUser = { id: input.customerId, name: "고객이름" };
      const driverUser = { id: input.driverId, name: "기사이름" };

      (authRepository.findAuthUserProfileById as jest.Mock).mockImplementation(async (id) => {
        if (id === input.customerId) return customerUser;
        if (id === input.driverId) return driverUser;
        return null;
      });

      (notificationRepository.createNotification as jest.Mock).mockImplementation(async (obj) => ({
        id: "notif-confirm",
        ...obj
      }));

      const customerEmitter = { write: jest.fn() };
      const driverEmitter = { write: jest.fn() };
      (sseEmitters as any)[customerUser.id] = customerEmitter;
      (sseEmitters as any)[driverUser.id] = driverEmitter;

      await notificationService.createEstimateConfirmNotification(input);

      expect(notificationRepository.createNotification).toHaveBeenCalledTimes(2);
      expect(customerEmitter.write).toHaveBeenCalledTimes(1);
      expect(driverEmitter.write).toHaveBeenCalledTimes(1);

      delete (sseEmitters as any)[customerUser.id];
      delete (sseEmitters as any)[driverUser.id];
    });

    it("고객 또는 기사 정보 없으면 오류 로그 후 종료", async () => {
      const input = {
        driverId: "driver1",
        customerId: "customer1",
        estimateId: "estimate123"
      };

      (authRepository.findAuthUserProfileById as jest.Mock).mockResolvedValue(null);

      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      await notificationService.createEstimateConfirmNotification(input);

      expect(consoleErrorSpy).toHaveBeenCalledWith("고객 혹은 기사 정보가 없습니다.");

      consoleErrorSpy.mockRestore();
    });
  });

  describe("createMoveDayReminderNotification", () => {
    it("고객과 기사에게 리마인더 알림 전송", async () => {
      const input = {
        customerId: "cus1",
        driverId: "drv1",
        fromAddressId: "from1",
        toAddressId: "to1"
      };
      const fromRegion = { region: "서울", district: "강남" };
      const toRegion = { region: "부산", district: "해운대" };
      const customerUser = { id: input.customerId, name: "고객" };
      const driverUser = { id: input.driverId, name: "기사" };

      (addressRepository.getRegionByAddress as jest.Mock).mockResolvedValue([fromRegion, toRegion]);
      (authRepository.findAuthUserProfileById as jest.Mock).mockImplementation(async (id) => {
        if (id === input.customerId) return customerUser;
        if (id === input.driverId) return driverUser;
        return null;
      });

      (notificationRepository.createNotification as jest.Mock).mockImplementation(async (obj) => ({
        id: "notif-move-day",
        ...obj
      }));

      const customerEmitter = { write: jest.fn() };
      const driverEmitter = { write: jest.fn() };
      (sseEmitters as any)[customerUser.id] = customerEmitter;
      (sseEmitters as any)[driverUser.id] = driverEmitter;

      await notificationService.createMoveDayReminderNotification(input);

      expect(notificationRepository.createNotification).toHaveBeenCalledTimes(2);
      expect(customerEmitter.write).toHaveBeenCalledTimes(1);
      expect(driverEmitter.write).toHaveBeenCalledTimes(1);

      delete (sseEmitters as any)[customerUser.id];
      delete (sseEmitters as any)[driverUser.id];
    });

    it("고객 또는 기사 정보 없으면 오류 로그 후 종료", async () => {
      const input = { customerId: "cus1", driverId: "drv1", fromAddressId: "f", toAddressId: "t" };
      (authRepository.findAuthUserProfileById as jest.Mock).mockResolvedValue(null);

      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      await notificationService.createMoveDayReminderNotification(input);

      expect(consoleErrorSpy).toHaveBeenCalledWith("고객 혹은 기사 정보가 없습니다.");

      consoleErrorSpy.mockRestore();
    });
  });

  describe("findAllNotificationsByUserId", () => {
    it("알림 목록을 리턴해야 한다", async () => {
      const userId = "userId";
      const mockList = [{ id: "1" }, { id: "2" }];

      (notificationRepository.getAllNotificationsWithDirection as jest.Mock).mockResolvedValue(mockList);

      const result = await notificationService.findAllNotificationsByUserId(userId);

      expect(notificationRepository.getAllNotificationsWithDirection).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockList);
    });
  });

  describe("findReceivedNotificationsByUserId", () => {
    it("받은 알림 목록을 리턴해야 한다", async () => {
      const userId = "userId";
      const mockList = [{ id: "recv1" }];

      (notificationRepository.getReceivedNotifications as jest.Mock).mockResolvedValue(mockList);

      const result = await notificationService.findReceivedNotificationsByUserId(userId);

      expect(notificationRepository.getReceivedNotifications).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockList);
    });
  });

  describe("findNotificationById", () => {
    it("특정 알림을 리턴해야 한다", async () => {
      const notifId = "notif123";
      const mockNotification = { id: notifId, message: "알림" };

      (notificationRepository.getNotificationById as jest.Mock).mockResolvedValue(mockNotification);

      const result = await notificationService.findNotificationById(notifId);

      expect(notificationRepository.getNotificationById).toHaveBeenCalledWith(notifId);
      expect(result).toEqual(mockNotification);
    });
  });

  describe("markNotificationAsRead", () => {
    it("읽지 않은 알림을 읽음 처리해야 한다", async () => {
      const notifId = "notifRead";
      const notification = { id: notifId, isRead: false };

      (notificationRepository.findById as jest.Mock).mockResolvedValue(notification);
      (notificationRepository.markAsRead as jest.Mock).mockResolvedValue({ ...notification, isRead: true });

      const result = await notificationService.markNotificationAsRead(notifId);

      expect(notificationRepository.findById).toHaveBeenCalledWith(notifId);
      expect(notificationRepository.markAsRead).toHaveBeenCalledWith(notifId);
      expect(result.isRead).toBe(true);
    });

    it("이미 읽은 알림은 중복 처리하지 않고 반환", async () => {
      const notifId = "notifRead";
      const notification = { id: notifId, isRead: true };

      (notificationRepository.findById as jest.Mock).mockResolvedValue(notification);

      const result = await notificationService.markNotificationAsRead(notifId);

      expect(notificationRepository.findById).toHaveBeenCalledWith(notifId);
      expect(notificationRepository.markAsRead).not.toHaveBeenCalled();
      expect(result).toEqual(notification);
    });

    it("알림을 찾을 수 없으면 에러를 던진다", async () => {
      const notifId = "notifNotFound";
      (notificationRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(notificationService.markNotificationAsRead(notifId)).rejects.toThrow(
        "해당 알림을 찾을 수 없습니다."
      );

      expect(notificationRepository.findById).toHaveBeenCalledWith(notifId);
    });
  });
});
