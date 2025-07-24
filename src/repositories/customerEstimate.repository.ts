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

  // 2. 같은 요청에 대한 다른 기사님 견적들을 모두 가져옴
  const requestId = targetEstimate.estimateRequestId;

  return await prisma.$transaction(async (tx) => {
    // 3. 선택된 견적을 ACCEPTED로
    await tx.estimate.update({
      where: { id: estimateId },
      data: { status: "ACCEPTED" }
    });

    // 4. 같은 요청의 다른 견적들을 모두 AUTO_REJECTED 처리
    await tx.estimate.updateMany({
      where: {
        estimateRequestId: requestId,
        id: { not: estimateId },
        status: "PROPOSED" // 확정하지 않은 나머지
      },
      data: { status: "AUTO_REJECTED" }
    });

    // 5. 요청 상태도 업데이트 (다른 api와 맞춰서 변경 가능성)
    await tx.estimateRequest.update({
      where: { id: requestId },
      data: { status: RequestStatus.APPROVED }
    });

    return { success: true, estimateId };
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

export default {
  getEstimateDetailById,
  acceptEstimateById,
  getReceivedEstimatesByCustomerId,
  getPendingEstimatesByCustomerId
};
