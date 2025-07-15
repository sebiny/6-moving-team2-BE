import { Request, Response } from "express";
import estimateReqService from "../services/estimateReq.service";
import { asyncHandler } from "../utils/asyncHandler";
import { CustomError } from "../utils/customError";

// 주소 등록
const createAddress = asyncHandler(async (req: Request, res: Response) => {
  const { postalCode, street, detail, region, district } = req.body;

  if (!postalCode || !street || !region || !district) {
    throw new CustomError(400, "필수 주소 정보가 누락되었습니다.");
  }

  const address = await estimateReqService.createAddress({
    postalCode,
    street,
    detail,
    region,
    district
  });

  res.status(201).json(address);
});

// 고객 주소 연결
const linkCustomerAddress = asyncHandler(async (req: Request, res: Response) => {
  const { customerId, addressId, role } = req.body;

  if (!customerId || !addressId || !role) {
    throw new CustomError(400, "필수 주소 정보가 누락되었습니다.");
  }

  const link = await estimateReqService.linkCustomerAddress({ customerId, addressId, role });
  res.status(201).json(link);
});

// 고객 주소 목록 조회
const getCustomerAddressesByRole = asyncHandler(async (req: Request, res: Response) => {
  const { role, customerId } = req.query;

  if (!customerId || typeof role !== "string") {
    throw new CustomError(400, "필수 요청 정보가 누락되었습니다.");
  }

  const addresses = await estimateReqService.getCustomerAddressesByRole(customerId as string, role);
  res.status(200).json(addresses);
});

// 견적 요청 생성
const createEstimateRequest = asyncHandler(async (req: Request, res: Response) => {
  const { customerId, moveType, moveDate, fromAddressId, toAddressId } = req.body;

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

  res.status(201).json(request);
});

export default {
  createAddress,
  linkCustomerAddress,
  getCustomerAddressesByRole,
  createEstimateRequest
};
