import { sseEmitters } from "../sse/sseEmitters";
import notificationRepository from "../repositories/notification.repository";
import notificationMessage from "../utils/notificationMessage";
import { AuthUser, Notification } from "@prisma/client";
import driverRepository from "../repositories/driver.repository";
import {
  createEstimateConfirmNotificationType,
  createEstimateProposalNotificationType,
  createMoveDayReminderNotificationType,
  EstimateReqNotification
} from "../types/notification.type";
import addressRepository from "../repositories/address.repository";
import authRepository from "../repositories/auth.repository";

/**
 * 특정 사용자에게 SSE 이벤트를 전송합니다.
 * @param userId - 이벤트를 받을 사용자 ID
 * @param data - 전송할 데이터 (보통 객체 형태)
 */
function sendSseEvent(userId: string, data: Notification) {
  const emitter = sseEmitters[userId];
  if (emitter) {
    emitter.write(`data: ${JSON.stringify(data)}\n\n`);
  }
}

/* 회원가입 환영 알림 */
async function createAndSendSignUpNotification(newUser: AuthUser) {
  const { name, id } = newUser;

  // 1. 알림 메시지 내용 생성
  const notificationPayload = notificationMessage.createSignUpSuccessPayload(name);

  // 2. DB에 알림 저장
  const newNotification = await notificationRepository.createNotification({
    message: notificationPayload.payload.message,
    type: notificationPayload.type,
    isRead: false,
    path: "",
    senderId: id,
    receiverId: id
  });

  // 3. 실시간으로 클라이언트에 알림 전송
  sendSseEvent(id, newNotification);
}

/* 견적 요청 알림 */
async function createAndSendEstimateReqNotification({
  customerId,
  moveType,
  fromAddressId,
  toAddressId
}: EstimateReqNotification) {
  // 고객 정보 먼저 조회하고 유효성 검사
  const customerAuthUser = await authRepository.findAuthUserProfileById(customerId);

  if (!customerAuthUser) {
    console.error(`[치명적 오류] 견적 요청 알림 생성 실패: 고객(ID: ${customerId})을 찾을 수 없습니다.`);
    return;
  }

  const customerName = customerAuthUser.name;

  // 2. 주소 및 드라이버 정보 조회
  const result = await addressRepository.getRegionByAddress(fromAddressId, toAddressId);
  const [fromRegion, toRegion] = result;
  const driversList = await driverRepository.getDriversByRegion({
    fromRegion: fromRegion.region,
    toRegion: toRegion.region
  });

  // 3. 고객에게 "견적 요청 완료" 알림 생성 및 전송
  const notificationPayloadForCustomer = notificationMessage.createEstimateReqSuccessPayloadForCustomer(
    customerName,
    moveType
  );

  const newNotification = await notificationRepository.createNotification({
    message: notificationPayloadForCustomer.payload.message,
    type: notificationPayloadForCustomer.type,
    isRead: false,
    path: "",
    senderId: customerAuthUser.id,
    receiverId: customerAuthUser.id
  });

  sendSseEvent(customerAuthUser.id, newNotification);

  //  기사가 없을 경우 고객에게 추가 알림 전송
  if (!driversList || driversList.length === 0) {
    console.warn(`해당 지역(${fromRegion.region}, ${toRegion.region})에 등록된 기사가 없습니다.`);

    const noDriverPayload = notificationMessage.createNoDriverFoundPayloadForCustomer(customerName);

    const noDriverNotification = await notificationRepository.createNotification({
      message: noDriverPayload.payload.message,
      type: noDriverPayload.type,
      isRead: false,
      path: "",
      senderId: customerAuthUser.id,
      receiverId: customerAuthUser.id
    });
    sendSseEvent(customerAuthUser.id, noDriverNotification);
    return;
  }

  // 기사에게 알림
  const notificationPayloadForDriver = notificationMessage.createEstimateReqSuccessPayloadForDriver(
    customerName,
    moveType
  );

  for (const driver of driversList) {
    if (!driver.authUserId) {
      console.warn(`[경고] Driver(ID: ${driver.id})의 authUserId가 존재하지 않아 알림을 건너뜁니다.`);
      continue;
    }
    try {
      const newNotification = await notificationRepository.createNotification({
        message: notificationPayloadForDriver.payload.message,
        type: notificationPayloadForDriver.type,
        isRead: false,
        path: "",
        senderId: customerAuthUser.id,
        receiverId: driver.authUserId
      });

      sendSseEvent(driver.authUserId, newNotification);
    } catch (error) {
      console.error(`기사(id: ${driver.authUserId})에게 알림을 보내는 중 오류 발생:`, error);
    }
  }
}

/* 견적 발송 알림 (기사 -> 고객) */
async function createEstimateProposalNotification({
  driverId,
  customerId,
  moveType
}: createEstimateProposalNotificationType) {
  const customerAuthUser = await authRepository.findAuthUserProfileById(customerId);
  const driverAuthUser = await authRepository.findAuthUserProfileById(driverId);

  // 고객에게 알림
  const notificationPayloadForCustomer = notificationMessage.createEstimateProposalSuccessPlayloadForCustomer(
    driverAuthUser?.name,
    moveType
  );

  if (!customerAuthUser) {
    console.error(`[치명적 오류] 견적 발송 알림 생성 실패: 고객(ID: ${customerId})을 찾을 수 없습니다.`);
    return;
  }

  const newNotificationForCustomer = await notificationRepository.createNotification({
    message: notificationPayloadForCustomer.payload.message,
    type: notificationPayloadForCustomer.type,
    isRead: false,
    path: "",
    senderId: customerAuthUser.id,
    receiverId: customerAuthUser.id
  });

  sendSseEvent(customerAuthUser.id, newNotificationForCustomer);
}

/* 견적 확정 알림 (고객 -> 기사) */
async function createEstimateConfirmNotification({
  driverId,
  customerId,
  estimateId
}: createEstimateConfirmNotificationType) {
  const customerAuthUser = await authRepository.findAuthUserProfileById(customerId); // 고객 id로 고객 정보 추출
  const driverAuthUser = await authRepository.findAuthUserProfileById(driverId); // 기사 id로 고객 정보 추출
  const customerName = customerAuthUser?.name; // 고객 정보에서 이름 추출
  const driverName = driverAuthUser?.name; // 기사 정보에서 이름 추출

  if (!customerAuthUser || !driverAuthUser) {
    console.error("고객 혹은 기사 정보가 없습니다.");
    return;
  }

  // 고객에게 알림
  const notificationPayloadForCustomer = notificationMessage.createEstimateConfirmPlayloadForCustomer(customerName);

  const newNotificationForCustomer = await notificationRepository.createNotification({
    message: notificationPayloadForCustomer.payload.message,
    type: notificationPayloadForCustomer.type,
    isRead: false,
    path: `./customer/my-estimates/${estimateId}`,
    senderId: customerAuthUser.id,
    receiverId: customerAuthUser.id
  });

  sendSseEvent(customerAuthUser.id, newNotificationForCustomer);

  // 기사에게 알림
  const notificationPayloadForDriver = notificationMessage.createEstimateConfirmPlayloadForDriver(driverName);

  const newNotificationForDriver = await notificationRepository.createNotification({
    message: notificationPayloadForDriver.payload.message,
    type: notificationPayloadForDriver.type,
    isRead: false,
    path: `./driver/my-estimates/sent/${estimateId}`,
    senderId: customerAuthUser.id,
    receiverId: driverAuthUser.id
  });

  sendSseEvent(driverAuthUser.id, newNotificationForDriver);
}

/* 이사 당일 리마인더 알림 (기사, 고객) */
async function createMoveDayReminderNotification({
  customerId,
  driverId,
  fromAddressId,
  toAddressId
}: createMoveDayReminderNotificationType) {
  const result = await addressRepository.getRegionByAddress(fromAddressId, toAddressId);
  const customerAuthUser = await authRepository.findAuthUserProfileById(customerId); // 고객 id로 고객 정보 추출
  const driverAuthUser = await authRepository.findAuthUserProfileById(driverId); // 기사 id로 고객 정보 추출

  if (!customerAuthUser || !driverAuthUser) {
    console.error("고객 혹은 기사 정보가 없습니다.");
    return;
  }

  const [from, to] = result;
  const notificationPayload = notificationMessage.createMoveDayReminderPlayload({
    fromRegion: from.region,
    fromDistrict: from.district,
    toRegion: to.region,
    toDistrict: to.district
  });

  const newNotificationForCustomer = await notificationRepository.createNotification({
    message: notificationPayload.payload.message,
    type: notificationPayload.type,
    isRead: false,
    path: ``,
    senderId: driverAuthUser.id,
    receiverId: customerAuthUser.id
  });

  const newNotificationForDriver = await notificationRepository.createNotification({
    message: notificationPayload.payload.message,
    type: notificationPayload.type,
    isRead: false,
    path: ``,
    senderId: customerAuthUser.id,
    receiverId: driverAuthUser.id
  });

  sendSseEvent(customerAuthUser.id, newNotificationForCustomer);
  sendSseEvent(driverAuthUser.id, newNotificationForDriver);
}

// 특정 사용자의 모든 알림 목록 조회
async function findAllNotificationsByUserId(userId: string) {
  return notificationRepository.getAllNotificationsWithDirection(userId);
}

// 특정 사용자의 받은 알림 목록 조회
async function findReceivedNotificationsByUserId(userId: string) {
  return notificationRepository.getReceivedNotifications(userId);
}

// 특정 사용자의 특정 알림 조회
async function findNotificationById(id: string) {
  return notificationRepository.getNotificationById(id);
}

/**
 * 특정 알림을 읽음 처리합니다. (권한 검사 포함)
 * @param userId - 요청한 사용자 ID
 * @param id - 읽음 처리할 알림 ID
 */
async function markNotificationAsRead(id: string): Promise<Notification> {
  const notification = await notificationRepository.findById(id);

  if (!notification) {
    throw new Error("해당 알림을 찾을 수 없습니다.");
  }

  // 이미 읽은 상태라면 불필요한 DB 업데이트를 방지할 수 있습니다.
  if (notification.isRead) {
    return notification;
  }
  return await notificationRepository.markAsRead(id);
}

export default {
  createAndSendSignUpNotification,
  createAndSendEstimateReqNotification,
  findAllNotificationsByUserId,
  markNotificationAsRead,
  createEstimateProposalNotification,
  createEstimateConfirmNotification,
  createMoveDayReminderNotification,
  findNotificationById,
  findReceivedNotificationsByUserId,
  sendSseEvent
};
