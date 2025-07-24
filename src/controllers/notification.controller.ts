import { sseEmitters } from "../sse/sseEmitters";
import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import notificationService from "../services/notification.service";

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
export const getMyNotifications = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    console.log(userId);
    res.status(401).json({ message: "인증되지 않은 사용자입니다." });
    return;
  }

  const notifications = await notificationService.findReceivedNotificationsByUserId(userId);

  res.status(200).json(notifications);
});

// 특정 알림 조회
export const getMyNotification = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { id } = req.params;

  if (!userId) {
    res.status(401).json({ message: "인증되지 않은 사용자입니다." });
    return;
  }

  const notification = await notificationService.findNotificationById(id);

  if (notification === undefined) {
    return res.status(404).json({ message: "알림이 없거나 권한이 없습니다." });
  }

  res.status(200).json(notification);
});

// 특정 알림 읽음 처리
export const updateMyNotification = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ message: "인증되지 않은 사용자입니다." });
    return;
  }

  try {
    const updatedNotification = await notificationService.markNotificationAsRead(id);

    res.status(200).json({
      message: "알림을 성공적으로 읽음 처리했습니다.",
      notification: updatedNotification
    });
  } catch (error: any) {
    if (error.name === "NotFoundError") {
      res.status(404).json({ message: error.message });
    } else if (error.name === "ForbiddenError") {
      res.status(403).json({ message: error.message });
    } else {
      res.status(500).json({ message: "서버 내부 오류가 발생했습니다." });
    }
  }
});
