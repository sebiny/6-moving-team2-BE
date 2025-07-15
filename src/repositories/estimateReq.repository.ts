import prisma from "../config/prisma";
import type { AddressRole } from "@prisma/client";
import { CreateAddressInput, LinkCustomerAddressInput, CreateEstimateRequestInput } from "../types/estimateReq.type";

// DB에 주소 등록
async function createAddress(data: CreateAddressInput) {
  return prisma.address.create({ data });
}

// 주소 중복 체크
async function findAddressByFields(postalCode: string, street: string, detail?: string | null) {
  return prisma.address.findFirst({
    where: {
      postalCode,
      street,
      ...(detail !== undefined ? { detail } : {})
    }
  });
}

// 고객(customer) 테이블에 연결(FROM, TO)
async function linkCustomerAddress(data: LinkCustomerAddressInput) {
  return prisma.customerAddress.create({ data });
}

// 고객(customer) 테이블에서 조회(FROM, TO)
async function getCustomerAddressesByRole(customerId: string, role: AddressRole) {
  return prisma.customerAddress.findMany({
    where: {
      customerId,
      role,
      deletedAt: null
    },
    include: {
      address: true
    }
  });
}

// 견적 요청
async function createEstimateRequest(data: CreateEstimateRequestInput) {
  return prisma.estimateRequest.create({ data });
}

// 활성 견적 요청 조회
async function findActiveEstimateRequest(customerId: string) {
  return prisma.estimateRequest.findFirst({
    where: {
      customerId,
      deletedAt: null,
      moveDate: {
        gt: new Date()
      },
      status: {
        in: ["PENDING", "APPROVED"]
      }
    }
  });
}

export default {
  createAddress,
  findAddressByFields,
  linkCustomerAddress,
  getCustomerAddressesByRole,
  createEstimateRequest,
  findActiveEstimateRequest
};
