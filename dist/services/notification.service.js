"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = void 0;
const sseEmitters_1 = require("../sse/sseEmitters");
const notification_Repository_1 = __importDefault(require("../repositories/notification.Repository"));
const notificationMessage_1 = require("../utils/notificationMessage");
const customError_1 = require("../utils/customError");
class NotificationService {
    /**
     * 특정 사용자에게 SSE 이벤트를 전송합니다.
     * @param userId - 이벤트를 받을 사용자 ID
     * @param data - 전송할 데이터 (보통 객체 형태)
     */
    sendSseEvent(userId, data) {
        const emitter = sseEmitters_1.sseEmitters[userId];
        if (emitter) {
            emitter.write(`data: ${JSON.stringify(data)}\n\n`);
        }
    }
    /**
     * 회원가입 축하 알림을 생성하고 실시간으로 전송합니다.
     * @param userId - 사용자 ID
     * @param userName - 사용자 이름
     */
    createAndSendSignUpNotification(newUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const { name, id } = newUser;
            // 1. 알림 메시지 내용 생성
            const notificationPayload = (0, notificationMessage_1.createSignUpSuccessPayload)(name);
            // 2. DB에 알림 저장
            const newNotification = yield notification_Repository_1.default.create({
                userId: id,
                userName: name,
                title: notificationPayload.payload.title,
                type: notificationPayload.type,
                isRead: false
            });
            // 3. 실시간으로 클라이언트에 알림 전송
            this.sendSseEvent(id, newNotification);
        });
    }
    /**
     * 특정 사용자의 모든 알림 목록을 조회합니다.
     * @param userId - 사용자 ID
     * @returns 알림 목록
     */
    findAllByUserId(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return notification_Repository_1.default.findAllByUserId(userId);
        });
    }
    /**
     * 특정 알림을 읽음 처리합니다. (권한 검사 포함)
     * @param userId - 요청한 사용자 ID
     * @param notificationId - 읽음 처리할 알림 ID
     */
    markNotificationAsRead(userId, notificationId) {
        return __awaiter(this, void 0, void 0, function* () {
            const notification = yield notification_Repository_1.default.findById(notificationId);
            // 알림이 없거나, 자신의 알림이 아닌 경우 에러 처리
            if (!notification || notification.receiverId !== userId) {
                throw new customError_1.CustomError(404, "알림을 찾을 수 없거나 권한이 없습니다.");
            }
            return notification_Repository_1.default.markAsRead(notificationId);
        });
    }
}
exports.notificationService = new NotificationService();
//# sourceMappingURL=notification.service.js.map