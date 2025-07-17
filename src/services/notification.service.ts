import { sseEmitters } from "../sse/sseEmitters";
import notificationRepository from "../repositories/notification.Repository";
import { createSignUpSuccessPayload } from "../utils/notificationMessage";
import { CustomError } from "../utils/customError";
import { $Enums, AuthUser } from "@prisma/client";

class NotificationService {
  /**
   * 특정 사용자에게 SSE 이벤트를 전송합니다.
   * @param userId - 이벤트를 받을 사용자 ID
   * @param data - 전송할 데이터 (보통 객체 형태)
   */
  private sendSseEvent(userId: string, data: object) {
    const emitter = sseEmitters[userId];
    if (emitter) {
      emitter.write(`data: ${JSON.stringify(data)}\n\n`);
    }
  }

  /**
   * 회원가입 축하 알림을 생성하고 실시간으로 전송합니다.
   * @param userId - 사용자 ID
   * @param userName - 사용자 이름
   */
  async createAndSendSignUpNotification(newUser: AuthUser) {
    const { name, id } = newUser;

    // 1. 알림 메시지 내용 생성
    const notificationPayload = createSignUpSuccessPayload(name);

    // 2. DB에 알림 저장
    const newNotification = await notificationRepository.create({
      userId: id,
      userName: name,
      title: JSON.stringify(notificationPayload.payload.title),
      type: notificationPayload.type
    });

    // 3. 실시간으로 클라이언트에 알림 전송
    this.sendSseEvent(id, newNotification);
  }

  /**
   * 특정 사용자의 모든 알림 목록을 조회합니다.
   * @param userId - 사용자 ID
   * @returns 알림 목록
   */
  async findAllByUserId(userId: string) {
    return notificationRepository.findAllByUserId(userId);
  }

  /**
   * 특정 알림을 읽음 처리합니다. (권한 검사 포함)
   * @param userId - 요청한 사용자 ID
   * @param notificationId - 읽음 처리할 알림 ID
   */
  async markNotificationAsRead(userId: string, notificationId: string) {
    const notification = await notificationRepository.findById(notificationId);

    // 알림이 없거나, 자신의 알림이 아닌 경우 에러 처리
    if (!notification || notification.receiverId !== userId) {
      throw new CustomError(404, "알림을 찾을 수 없거나 권한이 없습니다.");
    }

    return notificationRepository.markAsRead(notificationId);
  }
}

export const notificationService = new NotificationService();
