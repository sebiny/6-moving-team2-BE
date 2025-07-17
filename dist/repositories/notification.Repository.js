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
const prisma_1 = __importDefault(require("../config/prisma")); // Prisma 클라이언트 import
const client_1 = require("@prisma/client");
// 알림 데이터베이스 작업을 담당하는 객체
const notificationRepository = {
    /**
     * 새로운 알림을 데이터베이스에 생성합니다.
     * @param data - 생성할 알림 정보
     * @returns 생성된 알림 객체
     */
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.notification.create({
                data: {
                    title: data.title,
                    type: client_1.$Enums.NotificationType.MESSAGE,
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
        });
    },
    /**
     * 특정 사용자의 모든 알림을 최신순으로 조회합니다.
     * @param userId - 사용자 ID
     * @returns 알림 목록
     */
    findAllByUserId(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.notification.findMany({
                where: { receiverId: userId },
                orderBy: { createdAt: "desc" }
            });
        });
    },
    /**
     * 특정 알림을 읽음 처리합니다.
     * @param notificationId - 알림 ID
     * @returns 업데이트된 알림 객체
     */
    markAsRead(notificationId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.notification.update({
                where: { id: notificationId },
                data: { isRead: true }
            });
        });
    },
    /**
     * 특정 사용자의 모든 알림을 읽음 처리합니다.
     * @param userId - 사용자 ID
     * @returns 업데이트 작업 정보
     */
    markAllAsRead(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.notification.updateMany({
                where: { receiverId: userId, isRead: false },
                data: { isRead: true }
            });
        });
    },
    /**
     * 특정 알림을 삭제합니다.
     * @param notificationId - 알림 ID
     */
    delete(notificationId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield prisma_1.default.notification.delete({
                where: { id: notificationId }
            });
        });
    },
    /**
     * 특정 알림의 소유자를 확인하기 위해 알림 정보를 조회합니다.
     * @param notificationId - 알림 ID
     * @returns 알림 객체 또는 null
     */
    findById(notificationId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.notification.findUnique({
                where: { id: notificationId }
            });
        });
    }
};
exports.default = notificationRepository;
//# sourceMappingURL=notification.Repository.js.map