import { Request, Response } from "express";
import estimateReqService from "../services/estimateReq.service";
import { asyncHandler } from "../utils/asyncHandler";
import { CustomError } from "../utils/customError";
import notificationService from "../services/notification.service";

// 고객 주소 연결
const linkCustomerAddress = asyncHandler(async (req: Request, res: Response) => {
  const { addressId, role } = req.body;
  const customerId = req.user?.customerId;

  if (!customerId || !addressId || !role) {
    throw new CustomError(400, "필수 주소 정보가 누락되었습니다.");
  }

  const link = await estimateReqService.linkCustomerAddress({ customerId, addressId, role });
  res.status(201).json(link);
});

// 고객 주소 목록 조회
const getCustomerAddressesByRole = asyncHandler(async (req: Request, res: Response) => {
  const { role } = req.query;
  const customerId = req.user?.customerId;

  if (!customerId || typeof role !== "string") {
    throw new CustomError(400, "필수 요청 정보가 누락되었습니다.");
  }

  const addresses = await estimateReqService.getCustomerAddressesByRole(customerId as string, role);
  res.status(200).json(addresses);
});

// 일반 견적 요청 생성
const createEstimateRequest = asyncHandler(async (req: Request, res: Response) => {
  const customerId = req.user?.customerId;
  const { moveType, moveDate, fromAddressId, toAddressId } = req.body;

  if (!customerId || !moveType || !moveDate || !fromAddressId || !toAddressId) {
    throw new CustomError(400, "필수 요청 정보가 누락되었습니다.");
  }

  if (fromAddressId === toAddressId) {
    throw new CustomError(400, "출발지와 도착지는 서로 달라야 합니다.");
  }

  const request = await estimateReqService.createEstimateRequest({
    customerId,
    moveType,
    moveDate: new Date(moveDate),
    fromAddressId,
    toAddressId,
    status: "PENDING"
  });

  //알림 전송

  try {
    notificationService.createAndSendEstimateReqNotification({ customerId, moveType, fromAddressId, toAddressId });
  } catch (error) {
    console.error("알림 전송에 실패했습니다:", error);
  }

  res.status(201).json(request);
});

// 지정 견적 요청 생성
const createDesignatedEstimateRequest = asyncHandler(async (req: Request, res: Response) => {
  const { driverId } = req.body;
  const customerId = req.user?.customerId;

  if (!customerId) throw new CustomError(400, "고객 ID가 필요합니다.");
  if (!driverId) throw new CustomError(400, "기사 ID가 필요합니다.");

  const request = await estimateReqService.createDesignatedEstimateRequest(customerId, driverId);
  res.status(201).json({ message: "지정 견적 요청 완료", data: request });
});

// 활성 견적 요청 조회
const getActiveEstimateRequest = asyncHandler(async (req: Request, res: Response) => {
  const customerId = req.user?.customerId;

  if (!customerId) {
    throw new CustomError(400, "고객 ID가 필요합니다.");
  }

  const activeRequest = await estimateReqService.getActiveEstimateRequest(customerId);
  res.status(200).json(activeRequest);
});

export default {
  linkCustomerAddress,
  getCustomerAddressesByRole,
  createEstimateRequest,
  createDesignatedEstimateRequest,
  getActiveEstimateRequest
};
