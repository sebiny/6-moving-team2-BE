import prisma from "../config/prisma";
import type { AddressRole, RegionType } from "@prisma/client";
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
    },
    include: { designatedDrivers: true } // 지정 요청 기사 목록 포함
  });
}

//  출발지 지역 기반 기사 필터링
async function findDriversByRegion(region: RegionType, district: string) {
  return prisma.driverServiceArea.findMany({
    where: {
      OR: [{ region }, { district }],
      driver: { deletedAt: null }
    },
    select: { driverId: true }
  });
}

// 지정 기사 수 조회
async function getDesignatedDriverCount(estimateRequestId: string) {
  return prisma.designatedDriver.count({ where: { estimateRequestId } });
}

// DesignatedDriver 생성
async function createDesignatedDriver(estimateRequestId: string, driverId: string) {
  return prisma.designatedDriver.create({
    data: {
      estimateRequestId,
      driverId
    }
  });
}

export default {
  linkCustomerAddress,
  getCustomerAddressesByRole,
  createEstimateRequest,
  findActiveEstimateRequest,
  findDriversByRegion,
  getDesignatedDriverCount,
  createDesignatedDriver
};
