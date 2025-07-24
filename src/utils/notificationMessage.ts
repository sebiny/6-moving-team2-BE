import { $Enums, MoveType } from "@prisma/client";
import { createMoveDayReminderPlayloadType } from "../types/notification.type";

const moveTypeMap: { [key in MoveType]: string } = {
  [MoveType.SMALL]: "소형이사",
  [MoveType.HOME]: "가정이사",
  [MoveType.OFFICE]: "사무실이사"
};

// 회원가입 축하 메시지 생성
function createSignUpSuccessPayload(name: string) {
  return {
    type: $Enums.NotificationType.WELCOME,
    payload: {
      receivedName: name,
      message: `${name}님, 무빙 회원가입을 축하합니다!`,
      timeStamp: new Date().toISOString()
    }
  };
}

// 견적 요청 알림 메시지 (고객 > 고객)
function createEstimateReqSuccessPayloadForCustomer(customerName: string | undefined, moveType: MoveType) {
  const moveTypeText = moveTypeMap[moveType] || "이사"; // 한글로 변환
  return {
    type: $Enums.NotificationType.ESTIMATE_REQUEST, // 견적 요청 타입으로 메시지 생성
    payload: {
      customerName,
      message: `${customerName}님의 ${moveTypeText} 견적 요청이 전송되었어요.`,
      timeStamp: new Date().toISOString()
    }
  };
}

// 견적 요청할 기사 없음 알림 메시지 (고객 > 고객)
function createNoDriverFoundPayloadForCustomer(customerName: string | undefined) {
  return {
    type: $Enums.NotificationType.MESSAGE, // 견적 요청 타입으로 메시지 생성
    payload: {
      customerName,
      message: `${customerName}님, 죄송합니다. 현재 요청하신 지역에 이용 가능한 기사님이 없습니다.`,
      timeStamp: new Date().toISOString()
    }
  };
}

// 견적 요청 도착 알림 메시지 (고객 > 기사)
function createEstimateReqSuccessPayloadForDriver(customerName: string | undefined, moveType: MoveType) {
  const moveTypeText = moveTypeMap[moveType] || "이사"; // 한글로 변환
  return {
    type: $Enums.NotificationType.ESTIMATE_REQUEST, // 견적 요청 타입으로 메시지 생성
    payload: {
      customerName,
      message: `${customerName}님의 ${moveTypeText} 견적 요청이 도착했어요.`,
      timeStamp: new Date().toISOString()
    }
  };
}

// 새로운 견적 도착 알림 메시지 (기사 -> 고객)
function createEstimateProposalSuccessPlayloadForCustomer(driverName: string | undefined, moveType: MoveType) {
  const moveTypeText = moveTypeMap[moveType] || "이사"; // 한글로 변환
  return {
    type: $Enums.NotificationType.MESSAGE, // 견적 도착
    payload: {
      driverName,
      message: `${driverName} 기사님의 ${moveTypeText} 견적이 도착했어요.`,
      timeStamp: new Date().toISOString()
    }
  };
}

// 견적 확정 알림 메시지 (기사 -> 고객)
function createEstimateConfirmPlayloadForCustomer(customerName: string | undefined) {
  return {
    type: $Enums.NotificationType.MOVE_CONFIRMED, // 견적 확정
    payload: {
      customerName,
      message: `${customerName}님의 이사가 확정되었어요.`,
      timeStamp: new Date().toISOString()
    }
  };
}

// 견적 확정 알림 메시지 (고객 -> 기사)
function createEstimateConfirmPlayloadForDriver(driverName: string | undefined) {
  return {
    type: $Enums.NotificationType.ESTIMATE_ACCEPTED, // 견적 선택됨
    payload: {
      driverName,
      message: `${driverName} 기사님의 견적이 확정되었어요.`,
      timeStamp: new Date().toISOString()
    }
  };
}

// 이사 당일 알림 메시지
function createMoveDayReminderPlayload({
  fromRegion,
  fromDistrict,
  toRegion,
  toDistrict
}: createMoveDayReminderPlayloadType) {
  return {
    type: $Enums.NotificationType.MOVE_DAY_REMINDER, // 견적 도착
    payload: {
      message: `오늘은 ${fromRegion}(${fromDistrict}) → ${toRegion}(${toDistrict}) 이사 예정일이예요.`,
      timeStamp: new Date().toISOString()
    }
  };
}

export default {
  createSignUpSuccessPayload,
  createEstimateReqSuccessPayloadForCustomer,
  createEstimateReqSuccessPayloadForDriver,
  createEstimateProposalSuccessPlayloadForCustomer,
  createEstimateConfirmPlayloadForCustomer,
  createEstimateConfirmPlayloadForDriver,
  createNoDriverFoundPayloadForCustomer,
  createMoveDayReminderPlayload
};
