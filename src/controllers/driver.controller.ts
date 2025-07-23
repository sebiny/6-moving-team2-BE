import { MoveType, RegionType } from "@prisma/client";
import driverService from "../services/driver.service";
import { asyncHandler } from "../utils/asyncHandler";
import { Request, Response } from "express";

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

const getEstimateRequestsForDriver = asyncHandler(async (req: Request, res: Response) => {
  // driverId는 인증된 사용자에서 가져옴 (req.user)
  const driverId = req.user?.driverId;
  if (!driverId) {
    return res.status(401).json({ message: "Driver not authenticated" });
  }
  const requests = await driverService.getEstimateRequestsForDriver(driverId);
  res.status(200).json(requests);
});

const createEstimate = asyncHandler(async (req, res) => {
  const driverId = req.user?.driverId;
  const { requestId } = req.params;
  const { price, message } = req.body;

  if (!driverId) return res.status(401).json({ message: "Driver not authenticated" });

  // 중복 응답 방지
  const exists = await driverService.findEstimateByDriverAndRequest(driverId, requestId);
  if (exists) return res.status(409).json({ message: "이미 견적을 보냈습니다." });

  const estimate = await driverService.createEstimate({
    driverId,
    estimateRequestId: requestId,
    price,
    comment: message
  });

  res.status(201).json(estimate);
});

const rejectEstimateRequest = asyncHandler(async (req, res) => {
  const driverId = req.user?.driverId;
  const { requestId } = req.params;
  const { reason } = req.body; // 반려사유

  if (!driverId) return res.status(401).json({ message: "Driver not authenticated" });

  // 이미 해당 기사님이 이 요청에 대해 견적(Estimate)을 제출했는지 확인
  const estimate = await driverService.findEstimateByDriverAndRequest(driverId, requestId);
  if (!estimate) {
    return res.status(404).json({ message: "기사님의 견적이 존재하지 않습니다." });
  }

  // 이미 반려된 경우 방지
  if (estimate.status === "REJECTED") {
    return res.status(409).json({ message: "이미 반려 처리된 견적입니다." });
  }

  // 견적 상태와 반려사유 업데이트
  const updated = await driverService.rejectEstimate(estimate.id, reason);

  res.status(200).json(updated);
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
  getEstimateRequestsForDriver,
  createEstimate,
  rejectEstimateRequest,
  getMyEstimates,
  getEstimateDetail,
  getRejectedEstimateRequests
};
