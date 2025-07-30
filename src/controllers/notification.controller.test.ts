import { Request, Response } from "express";
import { connectSse, getMyNotifications, getMyNotification, updateMyNotification } from "./notification.controller"; // 실제 파일 경로에 맞게 수정하세요.
import notificationService from "../services/notification.service"; // 실제 파일 경로에 맞게 수정하세요.
import { sseEmitters } from "../sse/sseEmitters"; // 실제 파일 경로에 맞게 수정하세요.

// 의존성 모의 처리
jest.mock("../services/notification.service");
jest.mock("../sse/sseEmitters", () => ({
  sseEmitters: {} // 테스트에서 조작할 수 있도록 빈 객체로 설정
}));
jest.mock("../utils/asyncHandler", () => ({
  // asyncHandler는 비동기 함수를 받아 바로 실행하는 형태로 모의 처리
  asyncHandler: (fn: Function) => (req: Request, res: Response, next: Function) => fn(req, res, next)
}));

// Jest의 타이머 기능을 사용하기 위함
jest.useFakeTimers();

describe("Notification Controller", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  // 각 테스트가 실행되기 전에 mock 객체들을 초기화합니다.
  beforeEach(() => {
    mockRequest = {
      user: { id: "testUserId", userType: "CUSTOMER" }, // 인증된 사용자 Mock
      params: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(), // res.status(200).json(...) 체이닝을 위해 mockReturnThis() 사용
      json: jest.fn(),
      set: jest.fn(),
      flushHeaders: jest.fn(),
      write: jest.fn(),
      end: jest.fn()
    };
    mockNext = jest.fn(); // asyncHandler에서 사용될 수 있는 next 함수 Mock

    // 이전 테스트의 영향을 받지 않도록 모든 mock을 초기화합니다.
    jest.clearAllMocks();
  });

  describe("connectSse", () => {
    // SSE 연결은 EventEmitter를 상속받는 req 객체 Mock이 필요
    const mockSseRequest: any = {
      user: { id: "testUserId" },
      on: jest.fn((event, callback) => {
        if (event === "close") {
          // 'close' 이벤트에 대한 콜백을 저장해두었다가 테스트에서 수동으로 호출
          mockSseRequest.closeCallback = callback;
        }
      }),
      emit: function (event: string) {
        if (event === "close" && this.closeCallback) {
          this.closeCallback();
        }
      },
      closeCallback: null
    };

    it("인증된 사용자에 대해 SSE 연결을 성공적으로 설정해야 합니다.", () => {
      connectSse(mockSseRequest as Request, mockResponse as Response);

      expect(mockResponse.set).toHaveBeenCalledWith({
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive"
      });
      expect(mockResponse.flushHeaders).toHaveBeenCalledTimes(1);
      expect(sseEmitters["testUserId"]).toBe(mockResponse);
    });

    it("2분마다 ping 이벤트를 전송해야 합니다.", () => {
      connectSse(mockSseRequest as Request, mockResponse as Response);

      // 2분(120,000ms) 후
      jest.advanceTimersByTime(120 * 1000);

      expect(mockResponse.write).toHaveBeenCalledWith("event: ping\n");
      expect(mockResponse.write).toHaveBeenCalledWith("data: keepalive\n\n");
      expect(mockResponse.write).toHaveBeenCalledTimes(2);
    });

    it("연결이 종료되면 interval을 정리하고 emitter를 삭제해야 합니다.", () => {
      const clearIntervalSpy = jest.spyOn(global, "clearInterval");
      connectSse(mockSseRequest as Request, mockResponse as Response);

      expect(sseEmitters["testUserId"]).toBeDefined();

      // 'close' 이벤트 발생 시뮬레이션
      mockSseRequest.emit("close");

      expect(clearIntervalSpy).toHaveBeenCalled();
      expect(sseEmitters["testUserId"]).toBeUndefined();
    });

    it("인증되지 않은 사용자는 401 에러를 반환해야 합니다.", () => {
      mockRequest.user = undefined;
      connectSse(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.end).toHaveBeenCalledTimes(1);
    });
  });

  describe("getMyNotifications", () => {
    it("사용자의 모든 알림 목록을 성공적으로 반환해야 합니다.", async () => {
      const notifications = [{ id: "1", message: "Test Notification" }];
      (notificationService.findReceivedNotificationsByUserId as jest.Mock).mockResolvedValue(notifications);

      await getMyNotifications(mockRequest as Request, mockResponse as Response, mockNext);

      expect(notificationService.findReceivedNotificationsByUserId).toHaveBeenCalledWith("testUserId");
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(notifications);
    });

    it("인증되지 않은 사용자는 401 에러를 반환해야 합니다.", async () => {
      mockRequest.user = undefined;
      await getMyNotifications(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: "인증되지 않은 사용자입니다." });
    });
  });

  describe("getMyNotification", () => {
    it("특정 알림을 성공적으로 조회해야 합니다.", async () => {
      const notification = { id: "notif1", message: "Specific Notification" };
      mockRequest.params = { id: "notif1" };
      (notificationService.findNotificationById as jest.Mock).mockResolvedValue(notification);

      await getMyNotification(mockRequest as Request, mockResponse as Response, mockNext);

      expect(notificationService.findNotificationById).toHaveBeenCalledWith("notif1");
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(notification);
    });

    it("알림이 존재하지 않으면 404 에러를 반환해야 합니다.", async () => {
      mockRequest.params = { id: "nonexistent" };
      (notificationService.findNotificationById as jest.Mock).mockResolvedValue(undefined);

      await getMyNotification(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: "알림이 없거나 권한이 없습니다." });
    });
  });

  describe("updateMyNotification", () => {
    it("특정 알림을 성공적으로 읽음 처리해야 합니다.", async () => {
      const updatedNotification = { id: "notif1", isRead: true };
      mockRequest.params = { id: "notif1" };
      (notificationService.markNotificationAsRead as jest.Mock).mockResolvedValue(updatedNotification);

      await updateMyNotification(mockRequest as Request, mockResponse as Response, mockNext);

      expect(notificationService.markNotificationAsRead).toHaveBeenCalledWith("notif1");
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "알림을 성공적으로 읽음 처리했습니다.",
        notification: updatedNotification
      });
    });

    it("서비스에서 NotFoundError가 발생하면 404를 반환해야 합니다.", async () => {
      const error = new Error("알림을 찾을 수 없습니다.");
      error.name = "NotFoundError";
      mockRequest.params = { id: "notfound" };
      (notificationService.markNotificationAsRead as jest.Mock).mockRejectedValue(error);

      await updateMyNotification(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: error.message });
    });

    it("서비스에서 ForbiddenError가 발생하면 403을 반환해야 합니다.", async () => {
      const error = new Error("권한이 없습니다.");
      error.name = "ForbiddenError";
      mockRequest.params = { id: "forbidden" };
      (notificationService.markNotificationAsRead as jest.Mock).mockRejectedValue(error);

      await updateMyNotification(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: error.message });
    });

    it("알 수 없는 서버 오류 발생 시 500을 반환해야 합니다.", async () => {
      const error = new Error("DB 연결 실패");
      mockRequest.params = { id: "anyId" };
      (notificationService.markNotificationAsRead as jest.Mock).mockRejectedValue(error);

      await updateMyNotification(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: "서버 내부 오류가 발생했습니다." });
    });
  });
});
