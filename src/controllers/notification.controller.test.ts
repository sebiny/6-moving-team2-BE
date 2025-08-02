import { Request, Response } from "express";
import { connectSse, getMyNotifications, getMyNotification, updateMyNotification } from "./notification.controller";
import notificationService from "../services/notification.service";
import { sseEmitters } from "../sse/sseEmitters";
import { EventEmitter } from "events";

// 의존성 모의 처리
jest.mock("../services/notification.service");
jest.mock("../sse/sseEmitters", () => ({
  sseEmitters: {}
}));
jest.mock("../utils/asyncHandler", () => ({
  asyncHandler: (fn: Function) => (req: Request, res: Response, next: Function) => fn(req, res, next)
}));

class MockRequest extends EventEmitter {
  user: { id: string } | undefined = { id: "testUserId" };
  params = {};
}

class MockResponse extends EventEmitter {
  set = jest.fn();
  flushHeaders = jest.fn();
  write = jest.fn();
  end = jest.fn();
  status = jest.fn().mockReturnThis();
  json = jest.fn();

  resetMocks() {
    this.set.mockClear();
    this.flushHeaders.mockClear();
    this.write.mockClear();
    this.end.mockClear();
    this.status.mockClear();
    this.json.mockClear();
  }
}

describe("Notification Controller", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      user: { id: "testUserId", userType: "CUSTOMER" },
      params: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      set: jest.fn(),
      flushHeaders: jest.fn(),
      write: jest.fn(),
      end: jest.fn()
    };
    mockNext = jest.fn();

    jest.clearAllMocks();
    // sseEmitters 초기화
    Object.keys(sseEmitters).forEach((key) => delete sseEmitters[key]);
  });

  describe("connectSse", () => {
    let originalSetInterval: typeof setInterval;
    let originalClearInterval: typeof clearInterval;

    beforeAll(() => {
      // 기존 timer 함수들 백업
      originalSetInterval = global.setInterval;
      originalClearInterval = global.clearInterval;
    });

    beforeEach(() => {
      // SSE 테스트에서만 타이머 사용
      jest.useFakeTimers();
      jest.clearAllTimers();

      // sseEmitters 추가 초기화 (SSE 테스트용)
      Object.keys(sseEmitters).forEach((key) => delete sseEmitters[key]);
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
      jest.clearAllTimers();
    });

    afterAll(() => {
      // 원래 함수들 복원
      global.setInterval = originalSetInterval;
      global.clearInterval = originalClearInterval;
    });

    it("인증된 사용자에 대해 SSE 연결을 성공적으로 설정해야 합니다.", () => {
      const mockSseRequest = new MockRequest();
      const mockSseResponse = new MockResponse();

      connectSse(mockSseRequest as any, mockSseResponse as any);

      expect(mockSseResponse.set).toHaveBeenCalledWith({
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no"
      });
      expect(mockSseResponse.flushHeaders).toHaveBeenCalledTimes(1);
      expect(sseEmitters["testUserId"]).toBe(mockSseResponse);
    });

    it("30초마다 ping 이벤트를 전송해야 합니다.", () => {
      const mockSseRequest = new MockRequest();
      const mockSseResponse = new MockResponse();

      // setInterval spy 추가로 interval 설정 확인
      const setIntervalSpy = jest.spyOn(global, "setInterval");

      connectSse(mockSseRequest as any, mockSseResponse as any);

      // setInterval이 정확히 한 번만 호출되었는지 확인
      expect(setIntervalSpy).toHaveBeenCalledTimes(1);
      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 30000);

      // 초기 상태 확인
      expect(mockSseResponse.write).not.toHaveBeenCalled();

      // 30초 후
      jest.advanceTimersByTime(30 * 1000);

      expect(mockSseResponse.write).toHaveBeenCalledWith("event: ping\n");
      expect(mockSseResponse.write).toHaveBeenCalledWith("data: keepalive\n\n");
      expect(mockSseResponse.write).toHaveBeenCalledTimes(2);

      setIntervalSpy.mockRestore();
    });

    it("연결이 종료되면 interval을 정리하고 emitter를 삭제해야 합니다.", () => {
      const clearIntervalSpy = jest.spyOn(global, "clearInterval");
      const mockSseRequest = new MockRequest();
      const mockSseResponse = new MockResponse();

      connectSse(mockSseRequest as any, mockSseResponse as any);

      expect(sseEmitters["testUserId"]).toBeDefined();

      mockSseResponse.emit("close");

      expect(clearIntervalSpy).toHaveBeenCalled();
      expect(sseEmitters["testUserId"]).toBeUndefined();

      clearIntervalSpy.mockRestore();
    });

    it("인증되지 않은 사용자는 401 에러를 반환해야 합니다.", () => {
      const mockSseRequest = new MockRequest();
      const mockSseResponse = new MockResponse();

      // 인증되지 않은 사용자 설정
      mockSseRequest.user = undefined;

      connectSse(mockSseRequest as any, mockSseResponse as any);

      expect(mockSseResponse.status).toHaveBeenCalledWith(401);
      expect(mockSseResponse.end).toHaveBeenCalledTimes(1);
    });

    it("req의 close 이벤트도 정상적으로 처리되어야 합니다.", () => {
      const clearIntervalSpy = jest.spyOn(global, "clearInterval");
      const mockSseRequest = new MockRequest();
      const mockSseResponse = new MockResponse();

      connectSse(mockSseRequest as any, mockSseResponse as any);

      expect(sseEmitters["testUserId"]).toBeDefined();

      mockSseRequest.emit("close");

      expect(clearIntervalSpy).toHaveBeenCalled();
      expect(sseEmitters["testUserId"]).toBeUndefined();

      clearIntervalSpy.mockRestore();
    });

    it("error 이벤트 발생 시에도 정리 작업이 수행되어야 합니다.", () => {
      const clearIntervalSpy = jest.spyOn(global, "clearInterval");
      const mockSseRequest = new MockRequest();
      const mockSseResponse = new MockResponse();

      connectSse(mockSseRequest as any, mockSseResponse as any);

      expect(sseEmitters["testUserId"]).toBeDefined();

      mockSseResponse.emit("error", new Error("Connection error"));

      expect(clearIntervalSpy).toHaveBeenCalled();
      expect(sseEmitters["testUserId"]).toBeUndefined();

      clearIntervalSpy.mockRestore();
    });
  }); // ✅ connectSse describe 블록 닫기

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
