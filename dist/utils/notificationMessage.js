"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSignUpSuccessPayload = createSignUpSuccessPayload;
const client_1 = require("@prisma/client");
// 회원가입 축하 메시지 생성
function createSignUpSuccessPayload(name) {
    return {
        type: client_1.$Enums.NotificationType.MESSAGE,
        payload: {
            receivedName: name,
            title: `${name}님, 회원가입을 축하합니다!`,
            timeStamp: new Date().toISOString
        }
    };
}
// 견적 도착 메시지 생성
// export function createEstimateArrivedPayload(driverName: string, moveType: string): NotificationPayload {
//   return {
//     type: "ESTIMATE_REQUEST",
//     payload: {
//       driverName: newUser.,
//       moveType: moveType
//     }
//   };
// }
//# sourceMappingURL=notificationMessage.js.map