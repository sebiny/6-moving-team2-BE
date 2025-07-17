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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllNotifications = exports.connectSse = void 0;
const sseEmitters_1 = require("../sse/sseEmitters");
const asyncHandler_1 = require("../utils/asyncHandler");
const notification_service_1 = require("../services/notification.service");
const connectSse = (req, res) => {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
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
    sseEmitters_1.sseEmitters[userId] = res;
    req.on("close", () => {
        delete sseEmitters_1.sseEmitters[userId];
    });
};
exports.connectSse = connectSse;
// 알림 리스트 조회
exports.getAllNotifications = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!userId) {
        // authMiddleware가 있어서 이 경우는 거의 없지만, 방어 코드로 추가
        res.status(401).json({ message: "인증되지 않은 사용자입니다." });
        return;
    }
    // 서비스 또는 레포지토리를 통해 DB에서 해당 유저의 알림을 조회합니다.
    const notifications = yield notification_service_1.notificationService.findAllByUserId(userId);
    res.status(200).json(notifications);
}));
// 특정 알림 조회
// 알림 리스트 읽음 처리
// 특정 알림 읽음 처리
// 특정 알림 삭제 처리
//# sourceMappingURL=notification.controller.js.map