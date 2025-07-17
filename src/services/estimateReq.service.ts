import { AddressRole } from "@prisma/client";
import estimateReqRepository from "../repositories/estimateReq.repository";
import { LinkCustomerAddressInput, CreateEstimateRequestInput } from "../types/estimateReq.type";
import { CustomError } from "../utils/customError";

// 고객 주소 연결
async function linkCustomerAddress(data: LinkCustomerAddressInput) {
  return estimateReqRepository.linkCustomerAddress(data);
}

// 고객 주소 목록 조회
async function getCustomerAddressesByRole(customerId: string, role: string) {
  return estimateReqRepository.getCustomerAddressesByRole(customerId, role as AddressRole);
}

// 견적 요청 생성
async function createEstimateRequest(data: CreateEstimateRequestInput) {
  const { customerId } = data;

  const active = await estimateReqRepository.findActiveEstimateRequest(customerId);
  if (active) {
    throw new CustomError(409, "현재 진행 중인 이사 견적이 있습니다.");
  }
  // TODO: 최대 5명의 기사 요청 제한

  return estimateReqRepository.createEstimateRequest(data);
}

// 지정 견적 요청 생성
// async function createDesignatedEstimateRequest(customerId: string, driverId: string) {
//   const activeRequest = await estimateReqRepository.findActiveEstimateRequest(customerId);

//   if (!activeRequest) {
//     throw new CustomError(400, "진행 중인 일반 견적 요청이 없습니다.");
//   }

//   // 활성 견적 중 이미 확정된 견적이 있을 때
//   if (activeRequest.status === "APPROVED") {
//     throw new CustomError(409, "이미 기사님이 확정된 요청에는 지정 요청을 할 수 없습니다.");
//   }

//   // 동일 기사 중복 지정 방지
//   const alreadyDesignated = activeRequest.designatedDrivers.some((d) => d.driverId === driverId);
//   if (alreadyDesignated) {
//     throw new CustomError(409, "이미 지정된 기사님입니다.");
//   }

//   // 지정 기사 3명 제한
//   const designatedCount = await estimateReqRepository.getDesignatedDriverCount(activeRequest.id);
//   if (designatedCount >= 3) throw new CustomError(409, "최대 3명의 기사님만 지정할 수 있습니다.");

//   // 활성 견적에 지정 기사 연결
//   return await estimateReqRepository.createDesignatedDriver(activeRequest.id, driverId);
// }

export default {
  linkCustomerAddress,
  getCustomerAddressesByRole,
  createEstimateRequest
  // createDesignatedEstimateRequest
};
