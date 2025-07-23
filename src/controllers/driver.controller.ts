import { MoveType, RegionType } from "@prisma/client";
import driverService from "../services/driver.service";
import { asyncHandler } from "../utils/asyncHandler";
import { Request, Response } from "express";
import notificationService from "../services/notification.service";

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

const createEstimateProposal = asyncHandler(async (req: Request, res: Response) => {
  const { driverId, customerId, moveType } = req.body;
  notificationService.createEstimateProposalNotification({ driverId, customerId, moveType });
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
  createEstimateProposal
};
