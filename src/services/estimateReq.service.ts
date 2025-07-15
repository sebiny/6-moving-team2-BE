import { AddressRole } from "@prisma/client";
import estimateRepRepository from "../repositories/estimateReq.repository";
import { CreateAddressInput, LinkCustomerAddressInput, CreateEstimateRequestInput } from "../types/estimateReq.type";

// DB에 주소 등록
async function createAddress(data: CreateAddressInput) {
  const { postalCode, street, detail } = data;

  const existing = await estimateRepRepository.findAddressByFields(postalCode, street, detail);
  if (existing) return existing;

  return estimateRepRepository.createAddress(data);
}

// 고객 주소 연결
async function linkCustomerAddress(data: LinkCustomerAddressInput) {
  return estimateRepRepository.linkCustomerAddress(data);
}

// 고객 주소 목록 조회
async function getCustomerAddressesByRole(customerId: string, role: string) {
  return estimateRepRepository.getCustomerAddressesByRole(customerId, role as AddressRole);
}

// 견적 요청 생성
async function createEstimateRequest(data: CreateEstimateRequestInput) {
  const { customerId } = data;

  const active = await estimateRepRepository.findActiveEstimateRequest(customerId);
  if (active) {
    throw new Error("현재 진행 중인 이사 견적이 있습니다.");
  }
  // TODO: 최대 5명의 기사 요청 제한

  return estimateRepRepository.createEstimateRequest(data);
}

export default {
  createAddress,
  linkCustomerAddress,
  getCustomerAddressesByRole,
  createEstimateRequest
};
