import { $Enums } from "@prisma/client";

// 메시지 타입 정의
export type NotificationPayload = {
  type: $Enums.NotificationType;
  payload: {
    receivedName: string;
    driverName?: string;
    message?: string;
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
    type: $Enums.NotificationType.WELCOME,
    payload: {
      receivedName: name,
      message: `${name}님, 무빙 회원가입을 축하합니다!`,
      timeStamp: new Date().toISOString
    }
  };
}

// 로그인 확인 메시지 생성
export function createLogInSuccessPayload(name: string) {
  return {
    type: $Enums.NotificationType.WELCOME,
    payload: {
      receivedName: name,
      message: `${name}님, 로그인 하셨습니다.`,
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
