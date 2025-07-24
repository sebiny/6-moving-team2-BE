import { $Enums, MoveType, RegionType } from "@prisma/client";

// 견적 요청 타입
export type EstimateReqNotification = {
  customerId: string;
  moveType: MoveType; // 'HOME' | 'OFFICE' | 'SMALL'
  fromAddressId: string;
  toAddressId: string;
  name?: string;
};

// 알림 생성 시 필요한 데이터 타입
export type CreateNotificationData = {
  message: string;
  type: $Enums.NotificationType;
  isRead: boolean;
  path?: string;
  senderId: string;
  receiverId: string;
};

// 알림 메시지
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

// 제안한 견적 도착 알림
export type createEstimateProposalNotificationType = {
  driverId: string;
  customerId: string;
  moveType: MoveType;
  requestId: string;
};

// 견적 확정 알림
export type createEstimateConfirmNotificationType = {
  driverId: string;
  customerId: string;
  estimateId: string;
};

// 이사 당일 리마인더
export type createMoveDayReminderNotificationType = {
  customerId: string;
  driverId: string;
  fromAddressId: string;
  toAddressId: string;
};

export type getDriversByRegionType = {
  fromRegion?: string | undefined;
  toRegion?: string | undefined;
};

export type createMoveDayReminderPlayloadType = {
  fromRegion?: string | undefined;
  fromDistrict?: string | undefined;
  toRegion?: string | undefined;
  toDistrict?: string | undefined;
};
