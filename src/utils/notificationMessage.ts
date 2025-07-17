import { $Enums } from "@prisma/client";

// 메시지 타입 정의
export type NotificationPayload = {
  type: $Enums.NotificationType;
  payload: {
    receivedName: string;
    driverName?: string;
    title?: string;
    moveType?: string;
    userType?: $Enums.UserType;
    fromAddress?: string;
    toAddress?: string;
    designated?: boolean;
    rejectReason?: string;
    timeStamp?: () => string;
  };
};

// 회원가입 축하 메시지 생성
export function createSignUpSuccessPayload(name: string) {
  return {
    type: $Enums.NotificationType.MESSAGE,
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
