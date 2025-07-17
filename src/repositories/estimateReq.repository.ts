import prisma from "../config/prisma";
import type { AddressRole } from "@prisma/client";
import { LinkCustomerAddressInput, CreateEstimateRequestInput } from "../types/estimateReq.type";

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
    // include: { designatedDrivers: true } // 지정 요청 기사 목록 포함
  });
}

// DesignatedDriver 생성
// async function createDesignatedDriver(estimateRequestId: string, driverId: string) {
//   return prisma.designatedDriver.create({
//     data: {
//       estimateRequestId,
//       driverId
//     }
//   });
// }

// 현재 지정 기사 수 계산
// async function getDesignatedDriverCount(estimateRequestId: string) {
//   return prisma.designatedDriver.count({ where: { estimateRequestId } });
// }

export default {
  linkCustomerAddress,
  getCustomerAddressesByRole,
  createEstimateRequest,
  findActiveEstimateRequest
  // createDesignatedDriver,
  // getDesignatedDriverCount
};
