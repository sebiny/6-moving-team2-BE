import { MoveType, RegionType } from "@prisma/client";
import driverService from "../services/driver.service";
import { asyncHandler } from "../utils/asyncHandler";
import { Request, Response } from "express";
import notificationService from "../services/notification.service";
import estimateReqService from "../services/estimateReq.service";

const getAllDriversAuth = asyncHandler(async (req: Request, res: Response) => {
  const { keyword, orderBy, region, service, page } = req.query;
  const customerId = req.user?.customerId;
  const options = {
    keyword: keyword as string,
    orderBy: orderBy as "reviewCount" | "career" | "work" | "averageRating",
    region: region as RegionType,
    service: service as MoveType,
    page: Number(page) as number
  };
  const result = await driverService.getAllDrivers(options, customerId);
  res.status(200).json(result);
});

const getAllDrivers = asyncHandler(async (req: Request, res: Response) => {
  const { keyword, orderBy, region, service, page } = req.query;
  const options = {
    keyword: keyword as string,
    orderBy: orderBy as "reviewCount" | "career" | "work" | "averageRating",
    region: region as RegionType,
    service: service as MoveType,
    page: Number(page) as number
  };
  const result = await driverService.getAllDrivers(options);
  res.status(200).json(result);
});

const getDriverById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await driverService.getDriverById(id);
  res.status(200).json(result);
});

const getDriverByIdAuth = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const customerId = req.user?.customerId;
  const result = await driverService.getDriverById(id, customerId);
  res.status(200).json(result);
});

const getDriverReviews = asyncHandler(async (req: Request, res: Response) => {
  const { page } = req.query;
  const { id } = req.params;
  const result = await driverService.getDriverReviews(id, Number(page));
  res.status(200).json(result);
});

const updateDriver = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body;
  const result = await driverService.updateDriver(id, data);
  res.status(200).json(result);
});

const getDesignatedEstimateRequests = asyncHandler(async (req: Request, res: Response) => {
  const driverId = req.user?.driverId;
  if (!driverId) {
    return res.status(401).json({ message: "Driver not authenticated" });
  }
  const requests = await driverService.getDesignatedEstimateRequests(driverId);
  res.status(200).json(requests);
});

const getAvailableEstimateRequests = asyncHandler(async (req: Request, res: Response) => {
  const driverId = req.user?.driverId;
  if (!driverId) {
    return res.status(401).json({ message: "Driver not authenticated" });
  }
  const requests = await driverService.getAvailableEstimateRequests(driverId);
  res.status(200).json(requests);
});

const getAllEstimateRequests = asyncHandler(async (req: Request, res: Response) => {
  const driverId = req.user?.driverId;
  if (!driverId) {
    return res.status(401).json({ message: "Driver not authenticated" });
  }
  const requests = await driverService.getAllEstimateRequests(driverId);
  res.status(200).json(requests);
});

const createEstimate = asyncHandler(async (req, res) => {
  const driverId = req.user?.driverId;
  const { requestId } = req.params;
  const { price, message } = req.body;

  if (!driverId) return res.status(401).json({ message: "Driver not authenticated" });

  // price 검증
  if (!price || price <= 0 || isNaN(price)) {
    return res.status(400).json({ message: "유효한 견적가를 입력해주세요." });
  }

  // 견적 요청 상태 검증
  const estimateRequest = await estimateReqService.findRequestById(requestId);
  if (!estimateRequest) {
    return res.status(404).json({ message: "견적 요청을 찾을 수 없습니다." });
  }

  // PENDING 상태가 아닌 경우 견적을 받을 수 없음
  if (estimateRequest.status !== "PENDING") {
    return res.status(400).json({
      message: "이 견적 요청은 더 이상 견적을 받을 수 없습니다.",
      status: estimateRequest.status
    });
  }

  // 완료된 견적 요청인지 확인 (이사일이 지난 경우)
  const currentDate = new Date();
  const moveDate = new Date(estimateRequest.moveDate);
  if (moveDate < currentDate) {
    return res.status(400).json({
      message: "이사일이 지난 견적 요청에는 견적을 보낼 수 없습니다.",
      moveDate: estimateRequest.moveDate
    });
  }

  // 중복 응답 방지
  const exists = await driverService.findEstimateByDriverAndRequest(driverId, requestId);
  if (exists) return res.status(409).json({ message: "이미 견적을 보냈습니다." });

  // 응답 수 제한 확인
  const responseLimit = await driverService.checkResponseLimit(requestId, driverId);
  if (!responseLimit.canRespond) {
    return res.status(400).json({
      message: responseLimit.message,
      limit: responseLimit.limit,
      currentCount: responseLimit.currentCount
    });
  }

  const estimate = await driverService.createEstimate({
    driverId,
    estimateRequestId: requestId,
    price,
    comment: message
  });

  // 알림 전송
  try {
    const originalRequest = await estimateReqService.findRequestById(requestId);
    if (!originalRequest) {
      // originalRequest가 null이면, 알림 전송 로직을 실행하지 않고 에러를 기록합니다.
      console.error(`[Notification Error] 유효하지 않은 견적 요청 ID(${requestId})입니다. 알림을 보낼 수 없습니다.`);
      return;
    }
    const { customerId, moveType } = estimateRequest;
    await notificationService.createEstimateProposalNotification({
      driverId,
      customerId,
      moveType
    });
  } catch (error) {
    console.log("견적 발송 알림을 전송할 수 없습니다.");
  }
  res.status(201).json(estimate);
});

const rejectEstimateRequest = asyncHandler(async (req, res) => {
  const driverId = req.user?.driverId;
  const { requestId } = req.params;
  const { reason } = req.body; // 반려사유

  if (!driverId) return res.status(401).json({ message: "Driver not authenticated" });

  // 1. 견적 요청이 존재하는지 확인
  const estimateRequest = await estimateReqService.findRequestById(requestId);
  if (!estimateRequest) {
    return res.status(404).json({ message: "견적 요청을 찾을 수 없습니다." });
  }

  // 2. 견적 요청 상태 검증 (PENDING 상태가 아닌 경우 반려할 수 없음)
  if (estimateRequest.status !== "PENDING") {
    return res.status(400).json({
      message: "이 견적 요청은 더 이상 반려할 수 없습니다.",
      status: estimateRequest.status
    });
  }

  // 완료된 견적 요청인지 확인 (이사일이 지난 경우)
  const currentDate = new Date();
  const moveDate = new Date(estimateRequest.moveDate);
  if (moveDate < currentDate) {
    return res.status(400).json({
      message: "이사일이 지난 견적 요청에는 반려할 수 없습니다.",
      moveDate: estimateRequest.moveDate
    });
  }

  // 3. 이미 견적을 보냈는지 확인 (견적을 보낸 후에는 반려할 수 없음)
  const existingEstimate = await driverService.findEstimateByDriverAndRequest(driverId, requestId);
  if (existingEstimate) {
    return res.status(409).json({ message: "이미 견적을 보내셨습니다. 반려할 수 없습니다." });
  }

  // 4. 이미 반려했는지 확인
  const alreadyRejected = await estimateReqService.checkIfAlreadyRejected(driverId, requestId);
  if (alreadyRejected) {
    return res.status(409).json({ message: "이미 반려한 요청입니다." });
  }

  // 5. 응답 수 제한 확인 (반려도 응답으로 간주)
  const responseLimit = await driverService.checkResponseLimit(requestId, driverId);
  if (!responseLimit.canRespond) {
    return res.status(400).json({
      message: responseLimit.message,
      limit: responseLimit.limit,
      currentCount: responseLimit.currentCount
    });
  }

  // 6. 견적 요청 반려 처리
  const result = await estimateReqService.rejectEstimateRequest(driverId, requestId, reason);

  res.status(200).json({
    message: "견적 요청이 반려되었습니다.",
    data: result
  });
});

const getMyEstimates = asyncHandler(async (req, res) => {
  const driverId = req.user?.driverId;
  if (!driverId) return res.status(401).json({ message: "Driver not authenticated" });
  const estimates = await driverService.getMyEstimates(driverId);
  res.status(200).json(estimates);
});

const getEstimateDetail = asyncHandler(async (req, res) => {
  const driverId = req.user?.driverId;
  const { estimateId } = req.params;
  if (!driverId) return res.status(401).json({ message: "Driver not authenticated" });
  const detail = await driverService.getEstimateDetail(driverId, estimateId);
  if (!detail) return res.status(404).json({ message: "견적을 찾을 수 없습니다." });
  res.status(200).json(detail);
});

const getRejectedEstimateRequests = asyncHandler(async (req: Request, res: Response) => {
  const driverId = req.user?.driverId;
  if (!driverId) return res.status(401).json({ message: "Driver not authenticated" });

  const rejectedEstimates = await driverService.getRejectedEstimateRequests(driverId);
  res.status(200).json(rejectedEstimates);
});

export default {
  getAllDriversAuth,
  getAllDrivers,
  getDriverById,
  getDriverByIdAuth,
  getDriverReviews,
  updateDriver,
  getDesignatedEstimateRequests,
  getAvailableEstimateRequests,
  getAllEstimateRequests,
  createEstimate,
  rejectEstimateRequest,
  getMyEstimates,
  getEstimateDetail,
  getRejectedEstimateRequests
};
