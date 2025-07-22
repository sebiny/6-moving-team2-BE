import prisma from "../config/prisma";
import { RequestStatus } from "@prisma/client";

// ＜공통＞ 공통 데이터
function buildEstimateInclude() {
  return {
    driver: {
      include: {
        authUser: {
          select: {
            name: true,
            phone: true,
            email: true,
            imageUrl: true
          }
        },
        reviewsReceived: {
          select: {
            rating: true
          }
        },
        Favorite: true,
        career: true,
        work: true
      }
    },
    estimateRequest: {
      select: {
        createdAt: true,
        moveDate: true,
        moveType: true,
        fromAddress: {
          select: {
            region: true,
            district: true,
            street: true
          }
        },
        toAddress: {
          select: {
            region: true,
            district: true,
            street: true
          }
        }
      }
    }
  };
}

// ＜공통＞ 리뷰 계산 함수
function formatEstimate(estimate: any) {
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
      favoriteCount: estimate.driver.Favorite.length,
      career: estimate.driver.career,
      work: estimate.driver.work
    }
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
      fromAddress: true,
      toAddress: true,
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
  const estimatesList = firstRequest.estimates.map((estimate) => {
    const formatted = formatEstimate(estimate);
    delete formatted.estimateRequest;
    return formatted;
  });

  return {
    estimateRequest: {
      id: firstRequest.id,
      moveDate: firstRequest.moveDate,
      moveType: firstRequest.moveType,
      createdAt: firstRequest.createdAt,
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
      fromAddress: true,
      toAddress: true,
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
    const formattedEstimates = request.estimates
      .map((estimate) => {
        const formatted = formatEstimate(estimate);
        delete formatted.estimateRequest; // 중복 제거
        return formatted;
      })
      .sort((a, b) => {
        if (a.status === "ACCEPTED") return -1;
        if (b.status === "ACCEPTED") return 1;
        return 0;
      });

    return {
      estimateRequestId: request.id,
      createdAt: request.createdAt,
      moveDate: request.moveDate,
      moveType: request.moveType,
      fromAddress: request.fromAddress,
      toAddress: request.toAddress,
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
    include: buildEstimateInclude()
  });

  if (!estimate) return null;

  return formatEstimate(estimate);
}

export default {
  getEstimateDetailById,
  acceptEstimateById,
  getReceivedEstimatesByCustomerId,
  getPendingEstimatesByCustomerId
};
