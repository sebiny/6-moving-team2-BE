import prisma from "../config/prisma";
import type { AddressRole, RegionType } from "@prisma/client";
import { LinkCustomerAddressInput, CreateEstimateRequestInput } from "../types/estimateReq.type";
import dayjs from "dayjs";

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
      OR: [
        { status: "PENDING" },
        {
          status: "APPROVED",
          moveDate: {
            gte: dayjs().startOf("day").toDate()
          }
        }
      ]
    },
    include: { designatedDrivers: true } // 지정 요청 기사 목록 포함
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

// 견적요청서로 이사정보 조회
async function findRequestById(requestId: string) {
  return prisma.estimateRequest.findUnique({
    where: { id: requestId }
  });
}

// 이미 반려했는지 확인
async function checkIfAlreadyRejected(driverId: string, estimateRequestId: string) {
  const rejection = await prisma.driverEstimateRejection.findUnique({
    where: {
      estimateRequestId_driverId: {
        estimateRequestId,
        driverId
      }
    }
  });
  return !!rejection;
}

// 견적 요청 반려 처리
async function rejectEstimateRequest(driverId: string, estimateRequestId: string, reason: string) {
  // 트랜잭션으로 반려 기록 생성과 상태 변경을 함께 처리
  return await prisma.$transaction(async (tx) => {
    // 1. 반려 기록 생성
    const rejection = await tx.driverEstimateRejection.create({
      data: {
        driverId,
        estimateRequestId,
        reason
      }
    });

    // 2. 지정 요청인지 확인
    const designatedDrivers = await tx.designatedDriver.findMany({
      where: { estimateRequestId }
    });

    // 지정 요청이 아닌 경우 (일반 요청) - 상태 변경 없음
    if (designatedDrivers.length === 0) {
      return rejection;
    }

    // 3. 지정 요청인 경우 - 모든 지정 기사가 반려했는지 확인
    const rejectionCount = await tx.driverEstimateRejection.count({
      where: { estimateRequestId }
    });

    // 모든 지정 기사가 반려한 경우 EstimateRequest 상태를 REJECTED로 변경
    if (rejectionCount >= designatedDrivers.length) {
      await tx.estimateRequest.update({
        where: { id: estimateRequestId },
        data: { status: "REJECTED" }
      });
    }

    return rejection;
  });
}

export default {
  linkCustomerAddress,
  getCustomerAddressesByRole,
  createEstimateRequest,
  findActiveEstimateRequest,
  getDesignatedDriverCount,
  createDesignatedDriver,
  findRequestById,
  checkIfAlreadyRejected,
  rejectEstimateRequest
};
