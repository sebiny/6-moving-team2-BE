import prisma from "../config/prisma";
import { EstimateStatus, RequestStatus } from "@prisma/client";

// ＜공통＞ 공통 데이터
function buildEstimateInclude() {
  return {
    driver: {
      select: {
        profileImage: true,
        authUser: {
          select: {
            name: true,
            phone: true,
            email: true
          }
        },
        reviewsReceived: {
          select: {
            rating: true
          }
        },
        favorite: true,
        career: true,
        work: true
      }
    }
  };
}

// ＜공통＞ 리뷰 및 지정 여부 포함한 변환 함수
function formatEstimateWithDesignation(estimate: any, designatedDriverIds: string[]) {
  const reviewRatings = estimate.driver.reviewsReceived.map((r: any) => r.rating);
  const reviewCount = reviewRatings.length;
  const avgRating =
    reviewCount > 0
      ? Number((reviewRatings.reduce((a: number, b: number) => a + b, 0) / reviewCount).toFixed(1))
      : null;

  return {
    ...estimate,
    driver: {
      ...estimate.driver,
      avgRating,
      reviewCount,
      favoriteCount: estimate.driver.favorite.length,
      career: estimate.driver.career,
      work: estimate.driver.work
    },
    isDesignated: designatedDriverIds.includes(estimate.driverId)
  };
}
/**
 * 대기 중인 견적 리스트 조회
 */
async function getPendingEstimatesByCustomerId(customerId: string) {
  const estimateRequests = await prisma.estimateRequest.findMany({
    where: {
      customerId,
      status: RequestStatus.PENDING,
      deletedAt: null
    },
    include: {
      fromAddress: {
        select: {
          region: true,
          district: true
        }
      },
      toAddress: {
        select: {
          region: true,
          district: true
        }
      },
      designatedDrivers: { select: { driverId: true } },
      estimates: {
        where: {
          status: "PROPOSED",
          deletedAt: null
        },
        include: buildEstimateInclude(),
        orderBy: { createdAt: "asc" }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  if (estimateRequests.length === 0) {
    return {
      estimateRequest: null,
      estimates: []
    };
  }

  const firstRequest = estimateRequests[0];
  const designatedDriverIds = firstRequest.designatedDrivers.map((d) => d.driverId);
  const estimatesList = (firstRequest.estimates ?? []).map((estimate) =>
    formatEstimateWithDesignation(estimate, designatedDriverIds)
  );

  return {
    estimateRequest: {
      id: firstRequest.id,
      moveDate: firstRequest.moveDate,
      moveType: firstRequest.moveType,
      requestDate: firstRequest.createdAt,
      fromAddress: firstRequest.fromAddress,
      toAddress: firstRequest.toAddress
    },
    estimates: estimatesList
  };
}

/**
 * 받았던 견적 리스트 조회
 */
async function getReceivedEstimatesByCustomerId(customerId: string) {
  // 1. 확정된 견적 요청건 가져오기
  const estimateRequests = await prisma.estimateRequest.findMany({
    where: {
      customerId,
      status: RequestStatus.APPROVED,
      deletedAt: null
    },
    include: {
      fromAddress: {
        select: {
          street: true
        }
      },
      toAddress: {
        select: {
          street: true
        }
      },
      designatedDrivers: { select: { driverId: true } },
      estimates: {
        where: {
          status: { in: ["ACCEPTED", "AUTO_REJECTED"] },
          deletedAt: null
        },
        include: buildEstimateInclude(),
        orderBy: { createdAt: "asc" }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  // 2. 데이터 구조 가공
  return estimateRequests.map((request) => {
    const designatedDriverIds = request.designatedDrivers.map((d) => d.driverId);

    const formattedEstimates = request.estimates
      .map((estimate) => formatEstimateWithDesignation(estimate, designatedDriverIds))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
      estimateRequest: {
        id: request.id,
        moveDate: request.moveDate,
        moveType: request.moveType,
        requestDate: request.createdAt,
        fromAddress: request.fromAddress,
        toAddress: request.toAddress
      },
      estimateCount: formattedEstimates.length,
      estimates: formattedEstimates
    };
  });
}

/**
 * 견적 확정하기
 */
async function acceptEstimateById(estimateId: string) {
  // 1. 선택된 견적 찾기
  const targetEstimate = await prisma.estimate.findUnique({
    where: { id: estimateId },
    include: { estimateRequest: true }
  });

  if (!targetEstimate || targetEstimate.deletedAt) {
    throw new Error("해당 견적서를 찾을 수 없습니다.");
  }

  const requestId = targetEstimate.estimateRequestId;
  const driverId = targetEstimate.driverId;

  return await prisma.$transaction(async (tx) => {
    // 2. 선택된 견적을 ACCEPTED로
    await tx.estimate.update({
      where: { id: estimateId },
      data: { status: "ACCEPTED" }
    });

    // 3. 같은 요청의 다른 견적을 AUTO_REJECTED로
    await tx.estimate.updateMany({
      where: {
        estimateRequestId: requestId,
        id: { not: estimateId },
        status: "PROPOSED"
      },
      data: { status: "AUTO_REJECTED" }
    });

    // 4. 요청 상태 업데이트
    await tx.estimateRequest.update({
      where: { id: requestId },
      data: { status: RequestStatus.APPROVED }
    });

    // 5. 기사님의 work 1 증가
    const updatedDriver = await tx.driver.update({
      where: { id: driverId },
      data: { work: { increment: 1 } }
    });

    return {
      success: true,
      estimateId,
      driverWork: updatedDriver.work // 응답에 최신 work 포함
    };
  });
}

/**
 * 견적서 상세 조회 (대기 중인 & 받았던)
 */
async function getEstimateDetailById(estimateId: string) {
  const estimate = await prisma.estimate.findUnique({
    where: {
      id: estimateId,
      deletedAt: null
    },
    include: {
      ...buildEstimateInclude(),
      estimateRequest: {
        include: {
          fromAddress: {
            select: {
              street: true
            }
          },
          toAddress: {
            select: {
              street: true
            }
          },
          designatedDrivers: { select: { driverId: true } }
        }
      }
    }
  });

  if (!estimate) return null;

  const designatedDriverIds = estimate.estimateRequest.designatedDrivers.map((d) => d.driverId);
  const formatted = formatEstimateWithDesignation(estimate, designatedDriverIds);

  return {
    id: formatted.id,
    comment: formatted.comment,
    price: formatted.price,
    status: formatted.status as EstimateStatus,
    driver: {
      profileImage: formatted.driver.profileImage,
      name: formatted.driver.authUser.name,
      phone: formatted.driver.authUser.phone,
      email: formatted.driver.authUser.email,
      avgRating: formatted.driver.avgRating,
      reviewCount: formatted.driver.reviewCount,
      favoriteCount: formatted.driver.favoriteCount,
      career: formatted.driver.career,
      work: formatted.driver.work
    },
    requestDate: estimate.estimateRequest.createdAt,
    moveType: estimate.estimateRequest.moveType,
    moveDate: estimate.estimateRequest.moveDate,
    fromAddress: {
      street: estimate.estimateRequest.fromAddress.street
    },
    toAddress: {
      street: estimate.estimateRequest.toAddress.street
    },
    isDesignated: designatedDriverIds.includes(estimate.driverId)
  };
}

/**
 * (Notification) 고객 id로 이름 조회
 */
async function getCustomerNameById(customerId: string) {
  if (!customerId) return null;

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      authUser: {
        select: { name: true }
      }
    }
  });

  return customer?.authUser?.name || null;
}

/**
 * (Notification) 견적 Id로 고객/기사 Id 조회
 */
async function getCustomerAndDriverIdbyEstimateId(estimateId: string) {
  const estimate = await prisma.estimate.findUnique({
    where: { id: estimateId },
    select: {
      driverId: true,
      estimateRequest: {
        select: { customerId: true }
      }
    }
  });

  if (!estimate) throw new Error("견적을 찾을 수 없습니다.");

  return {
    driverId: estimate.driverId,
    customerId: estimate.estimateRequest.customerId
  };
}

/**
 * (Notification) 이사 당일 리마인더 리스트 추출
 */
async function getMoveDayReminderNotificaiton() {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const estimates = await prisma.estimate.findMany({
    where: {
      status: "ACCEPTED",
      estimateRequest: {
        moveDate: today,
        deletedAt: null
      }
    },
    include: {
      driver: {
        select: {
          id: true,
          authUser: { select: { name: true, email: true } }
        }
      },
      estimateRequest: {
        select: {
          customerId: true,
          moveDate: true
        }
      }
    }
  });

  return estimates;
}

// (Notification) 이사 당일 리마인더 실행 로직

export default {
  getEstimateDetailById,
  acceptEstimateById,
  getReceivedEstimatesByCustomerId,
  getPendingEstimatesByCustomerId,
  getCustomerNameById,
  getCustomerAndDriverIdbyEstimateId,
  getMoveDayReminderNotificaiton
};
