import { AddressRole } from "@prisma/client";
import estimateReqRepository from "../repositories/estimateReq.repository";
import { LinkCustomerAddressInput, CreateEstimateRequestInput } from "../types/estimateReq.type";
import { CustomError } from "../utils/customError";
import dayjs from "dayjs";

// 고객 주소 연결
async function linkCustomerAddress(data: LinkCustomerAddressInput) {
  return estimateReqRepository.linkCustomerAddress(data);
}

// 고객 주소 목록 조회
async function getCustomerAddressesByRole(customerId: string, role: string) {
  return estimateReqRepository.getCustomerAddressesByRole(customerId, role as AddressRole);
}

// 일반 견적 요청 생성
async function createEstimateRequest(data: CreateEstimateRequestInput) {
  const { customerId, fromAddressId, toAddressId, moveDate } = data;

  if (fromAddressId === toAddressId) {
    throw new CustomError(400, "sameAddressNotAllowed");
  }

  if (dayjs(moveDate).isBefore(dayjs().startOf("day"))) {
    throw new CustomError(400, "moveDateInPast");
  }

  const active = await estimateReqRepository.findActiveEstimateRequest(customerId);
  if (active) {
    throw new CustomError(409, "activeEstimateExists");
  }

  return estimateReqRepository.createEstimateRequest(data);
}

// 지정 견적 요청 생성
async function createDesignatedEstimateRequest(customerId: string, driverId: string) {
  const activeRequest = await estimateReqRepository.findActiveEstimateRequest(customerId);

  if (!activeRequest) {
    throw new CustomError(400, "noEstimateRequest");
  }

  if (activeRequest.status === "APPROVED") {
    throw new CustomError(409, "alreadyApprovedEstimateRequest");
  }

  const alreadyDesignated = activeRequest.designatedDrivers?.some((d) => d.driverId === driverId);
  if (alreadyDesignated) {
    throw new CustomError(409, "alreadyDesignatedDriver");
  }

  const designatedCount = await estimateReqRepository.getDesignatedDriverCount(activeRequest.id);
  if (designatedCount >= 3) {
    throw new CustomError(409, "maxThreeDriver");
  }

  return estimateReqRepository.createDesignatedDriver(activeRequest.id, driverId);
}

// 활성 견적 요청 조회
async function getActiveEstimateRequest(customerId: string) {
  return estimateReqRepository.findActiveEstimateRequest(customerId);
}

async function findRequestById(requestId: string) {
  return estimateReqRepository.findRequestById(requestId);
}

// 이미 반려했는지 확인
async function checkIfAlreadyRejected(driverId: string, estimateRequestId: string) {
  return estimateReqRepository.checkIfAlreadyRejected(driverId, estimateRequestId);
}

// 견적 요청 반려 처리
async function rejectEstimateRequest(driverId: string, estimateRequestId: string, reason: string) {
  return estimateReqRepository.rejectEstimateRequest(driverId, estimateRequestId, reason);
}

export default {
  linkCustomerAddress,
  getCustomerAddressesByRole,
  createEstimateRequest,
  createDesignatedEstimateRequest,
  getActiveEstimateRequest,
  findRequestById,
  checkIfAlreadyRejected,
  rejectEstimateRequest
};
