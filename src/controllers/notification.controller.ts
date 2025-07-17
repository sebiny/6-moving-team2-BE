import { sseEmitters } from "../sse/sseEmitters";
import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { notificationService } from "../services/notification.service";

export const connectSse = (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).end();
    return;
  }

  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive"
  });
  res.flushHeaders();

  // 사용자별로 SSE 연결 관리
  sseEmitters[userId] = res;

  const pingInterval = setInterval(() => {
    res.write("event: ping\n");
    res.write(`data: keepalive\n\n`);
  }, 1000 * 120); // 2분(120초)마다 ping (타임아웃보다 짧게)

  req.on("close", () => {
    clearInterval(pingInterval);
    delete sseEmitters[userId];
  });
};

// 알림 리스트 조회

export const getAllNotifications = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    // authMiddleware가 있어서 이 경우는 거의 없지만, 방어 코드로 추가
    res.status(401).json({ message: "인증되지 않은 사용자입니다." });
    return;
  }

  // 서비스 또는 레포지토리를 통해 DB에서 해당 유저의 알림을 조회합니다.
  const notifications = await notificationService.findAllByUserId(userId);

  res.status(200).json(notifications);
});

// 특정 알림 조회

// 알림 리스트 읽음 처리

// 특정 알림 읽음 처리

// 특정 알림 삭제 처리
