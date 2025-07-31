import { MoveType, RegionType } from "@prisma/client";
import prisma from "../config/prisma";
import { getDriversByRegionType } from "../types/notification.type";
import { CustomError } from "../utils/customError";

export type EditDataType = {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
};

export type optionsType = {
  keyword?: string;
  orderBy?: "reviewCount" | "career" | "work" | "averageRating";
  region?: RegionType;
  service?: MoveType;
  page: number;
};

//기사님 찾기
async function getAllDrivers(options: optionsType, userId?: string) {
  const { keyword = "", orderBy = "work", region, service, page = 1 } = options;

  const orderByClause =
    orderBy === "reviewCount"
      ? {
          reviewsReceived: {
            _count: "desc" as const
          }
        }
      : { [orderBy]: "desc" as const };

  const PAGE_SIZE = 3;
  const skip = (page - 1) * PAGE_SIZE;

  const drivers = await prisma.driver.findMany({
    where: {
      OR: [{ nickname: { contains: keyword, mode: "insensitive" } }],
      ...(service && { moveType: { has: service } }),
      ...(region && { serviceAreas: { some: { region } } })
    },
    skip: skip,
    take: PAGE_SIZE + 1, //hasNext 확인하기 위해 하나 더 가져옴
    orderBy: orderByClause,
    include: {
      _count: { select: { reviewsReceived: true, favorite: true } },
      serviceAreas: true,
      favorite: userId ? { where: { customerId: userId }, select: { id: true } } : false
    }
  });

  const hasNext = drivers.length > PAGE_SIZE;
  const data = drivers.slice(0, PAGE_SIZE).map((driver) => {
    const isFavorite = userId ? driver.favorite.length > 0 : false;
    const { favorite, _count, ...rest } = driver;
    return { ...rest, isFavorite, reviewCount: _count.reviewsReceived, favoriteCount: _count.favorite };
  });

  return { data, hasNext };
}

//기사님 상세 정보
async function getDriverById(id: string, userId?: string) {
  const driver = await prisma.driver.findUnique({
    where: { id },
    include: {
      _count: { select: { reviewsReceived: true, favorite: true } },
      serviceAreas: true,
      favorite: userId ? { where: { customerId: userId }, select: { id: true } } : false
    }
  });

  if (!driver) return null;
  const isFavorite = userId ? driver.favorite.length > 0 : false;
  const { favorite, _count, ...rest } = driver;
  return { ...rest, isFavorite, reviewCount: _count.reviewsReceived, favoriteCount: _count.favorite };
}

//기사님 리뷰 (페이지네이션 때문에 분리)
async function getDriverReviews(id: string, page: number) {
  const PAGE_SIZE = 3;
  const skip = (page - 1) * PAGE_SIZE;
  const reviews = await prisma.review.findMany({ where: { driverId: id }, skip: skip, take: PAGE_SIZE });
  return reviews;
}

//기사님 프로필 업데이트
async function updateDriver(id: string, data: EditDataType) {
  return await prisma.authUser.update({ where: { id }, data });
}

// 지정 견적 요청 리스트 조회 (고객이 기사에게 직접 요청한 것만)
async function getDesignatedEstimateRequests(driverId: string) {
  // 1. 모든 지정 견적 요청 조회 (완료되지 않은 것만)
  const requests = await prisma.estimateRequest.findMany({
    where: {
      designatedDrivers: {
        some: { driverId }
      },
      status: { not: "COMPLETED" }, // 완료된 견적 제외
      deletedAt: null
    },
    include: {
      customer: {
        include: {
          authUser: {
            select: { name: true }
          }
        }
      },
      fromAddress: true,
      toAddress: true
    }
  });

  console.log(`지정 견적 요청 조회: ${requests.length}개 (완료 제외)`);

  // 2. 기사님이 반려한 요청 조회
  const driverRejections = await prisma.driverEstimateRejection.findMany({
    where: { driverId },
    select: { estimateRequestId: true }
  });
  const rejectedRequestIds = driverRejections.map((r) => r.estimateRequestId);

  // 3. 기사님이 이미 견적을 보낸 요청 조회 (PROPOSED or ACCEPTED)
  const driverEstimates = await prisma.estimate.findMany({
    where: {
      driverId,
      status: {
        in: ["PROPOSED", "ACCEPTED"]
      }
    },
    select: { estimateRequestId: true }
  });
  const respondedRequestIds = driverEstimates.map((e) => e.estimateRequestId);

  // 4. 반려 + 응답한 요청 제외
  const filteredRequests = requests.filter(
    (request) => !rejectedRequestIds.includes(request.id) && !respondedRequestIds.includes(request.id)
  );

  // 5. isDesignated: true 표시
  return filteredRequests.map((request) => ({
    ...request,
    isDesignated: true
  }));
}

// 서비스 가능 지역 견적 요청 리스트 조회
async function getAvailableEstimateRequests(driverId: string) {
  // 1. 기사의 서비스 가능 지역 조회
  const driverServiceAreas = await prisma.driverServiceArea.findMany({
    where: { driverId }
  });

  if (driverServiceAreas.length === 0) {
    console.log(`❌ 기사 ${driverId}의 서비스 가능 지역이 없습니다.`);
    return [];
  }

  // 2. 해당 지역의 일반 요청 조회 (지정되지 않은 요청, 완료되지 않은 것만)
  const availableRequests = await prisma.estimateRequest.findMany({
    where: {
      AND: [
        {
          OR: driverServiceAreas.map((area) => ({
            OR: [{ fromAddress: { region: area.region } }, { toAddress: { region: area.region } }]
          }))
        },
        {
          // 지정되지 않은 요청만 (DesignatedDriver가 없는 요청)
          designatedDrivers: {
            none: {}
          }
        },
        { status: { not: "COMPLETED" } }, // 완료된 견적 제외
        { deletedAt: null }
      ]
    },
    include: {
      customer: {
        include: {
          authUser: {
            select: { name: true }
          }
        }
      },
      fromAddress: true,
      toAddress: true
    }
  });

  // 3. 기사가 이미 응답하거나 반려한 요청 제외
  const driverEstimates = await prisma.estimate.findMany({
    where: {
      driverId,
      OR: [
        { status: "PROPOSED" }, // 제안한 견적
        { status: "REJECTED" } // 반려한 견적
      ]
    },
    select: { estimateRequestId: true }
  });

  // 4. 기사가 반려한 견적 요청 제외
  const driverRejections = await prisma.driverEstimateRejection.findMany({
    where: { driverId },
    select: { estimateRequestId: true }
  });

  const respondedRequestIds = driverEstimates.map((estimate) => estimate.estimateRequestId);
  const rejectedRequestIds = driverRejections.map((rejection) => rejection.estimateRequestId);

  const filteredRequests = availableRequests.filter(
    (request) => !respondedRequestIds.includes(request.id) && !rejectedRequestIds.includes(request.id)
  );

  // 일반견적 요청임을 표시
  return filteredRequests.map((request) => ({
    ...request,
    isDesignated: false
  }));
}

// 모든 견적 요청 리스트 조회 (지정 + 서비스 가능 지역)
async function getAllEstimateRequests(driverId: string) {
  const [designatedRequests, availableRequests] = await Promise.all([
    getDesignatedEstimateRequests(driverId),
    getAvailableEstimateRequests(driverId)
  ]);

  // 각각 이미 isDesignated 필드가 포함되어 있으므로 그대로 합치기
  return [...designatedRequests, ...availableRequests];
}

async function findEstimateByDriverAndRequest(driverId: string, estimateRequestId: string) {
  return prisma.estimate.findFirst({
    where: { driverId, estimateRequestId, deletedAt: null }
  });
}

async function createEstimate(data: { driverId: string; estimateRequestId: string; price: number; comment?: string }) {
  return prisma.$transaction(async (tx) => {
    // 지정 요청인지 확인
    const designatedDrivers = await tx.designatedDriver.findMany({
      where: { estimateRequestId: data.estimateRequestId }
    });

    const isDesignatedRequest = designatedDrivers.length > 0;
    const limit = isDesignatedRequest ? 3 : 5; // 지정 요청: 3개, 일반 요청: 5개

    // 현재 응답 수 계산 (견적 + 반려)
    const [estimateCount, rejectionCount] = await Promise.all([
      tx.estimate.count({
        where: { estimateRequestId: data.estimateRequestId, deletedAt: null }
      }),
      tx.driverEstimateRejection.count({
        where: { estimateRequestId: data.estimateRequestId }
      })
    ]);

    const currentCount = estimateCount + rejectionCount;

    if (currentCount >= limit) {
      throw new CustomError(
        400,
        isDesignatedRequest ? "지정된 모든 기사님이 응답하셨습니다." : "이미 최대 응답 가능 기사님 수를 초과했습니다."
      );
    }

    return tx.estimate.create({
      data: {
        ...data,
        status: "PROPOSED",
        isDesignated: isDesignatedRequest
      }
    });
  });
}

async function rejectEstimate(estimateId: string, reason: string) {
  return prisma.estimate.update({
    where: { id: estimateId },
    data: {
      status: "REJECTED",
      rejectReason: reason
    }
  });
}

async function getMyEstimates(driverId: string) {
  // 기사님이 보낸 모든 견적 리스트 반환
  const estimates = await prisma.estimate.findMany({
    where: { driverId, deletedAt: null },
    include: {
      estimateRequest: {
        include: {
          customer: {
            include: {
              authUser: {
                select: { name: true }
              }
            }
          },
          fromAddress: true,
          toAddress: true
        }
      }
    },
    orderBy: {
      createdAt: "desc" // 최신순 정렬
    }
  });

  // 견적 완료 상태 판단 로직
  const currentDate = new Date();
  return estimates.map((estimate) => {
    const { estimateRequest } = estimate;
    const moveDate = new Date(estimateRequest.moveDate);

    // 완료 상태 판단:
    // 1. 스케줄러가 업데이트한 COMPLETED 상태 (우선순위)
    // 2. ACCEPTED 상태이면서 이사일이 지남
    // 3. 이사일이 지났지만 아직 확정되지 않음
    let completionStatus = null;
    let isCompleted = false;

    if (estimateRequest.status === "COMPLETED") {
      completionStatus = "COMPLETED";
      isCompleted = true;
    } else if (estimate.status === "ACCEPTED" && moveDate < currentDate) {
      completionStatus = "CONFIRMED_AND_PAST";
      isCompleted = true;
    } else if (moveDate < currentDate) {
      completionStatus = "DATE_PAST";
      isCompleted = true;
    }

    return {
      ...estimate,
      completionStatus,
      isCompleted,
      customerName: estimateRequest.customer.authUser.name,
      isDesignated: estimate.isDesignated
    };
  });
}

async function getEstimateDetail(driverId: string, estimateId: string) {
  // 기사 본인이 보낸 견적만 조회, 상세 정보 포함
  return await prisma.estimate.findFirst({
    where: { id: estimateId, driverId, deletedAt: null },
    include: {
      estimateRequest: {
        include: {
          customer: {
            include: {
              authUser: {
                select: { name: true }
              }
            }
          },
          fromAddress: true,
          toAddress: true
        }
      }
    }
  });
}

async function getRejectedEstimateRequests(driverId: string) {
  const rejections = await prisma.driverEstimateRejection.findMany({
    where: {
      driverId
    },
    include: {
      estimateRequest: {
        include: {
          customer: {
            include: {
              authUser: {
                select: { name: true }
              }
            }
          },
          fromAddress: true,
          toAddress: true,
          designatedDrivers: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  // 각 반려 요청에 대해 isDesignated 필드 추가
  return rejections.map((rejection) => ({
    ...rejection,
    estimateRequest: {
      ...rejection.estimateRequest,
      isDesignated: rejection.estimateRequest.designatedDrivers.length > 0
    }
  }));
}

// 응답 수 제한 확인 (일반 요청: 5명, 지정 요청: 지정 기사 수)
async function checkResponseLimit(estimateRequestId: string, driverId: string) {
  // 지정 요청인지 확인
  const designatedDrivers = await prisma.designatedDriver.findMany({
    where: { estimateRequestId }
  });

  const isDesignatedRequest = designatedDrivers.length > 0;
  const limit = isDesignatedRequest ? designatedDrivers.length : 5;

  // 현재 응답 수 계산 (견적 + 반려)
  const [estimateCount, rejectionCount] = await Promise.all([
    prisma.estimate.count({
      where: { estimateRequestId, deletedAt: null }
    }),
    prisma.driverEstimateRejection.count({
      where: { estimateRequestId }
    })
  ]);

  const currentCount = estimateCount + rejectionCount;
  const canRespond = currentCount < limit;

  return {
    canRespond,
    limit,
    currentCount,
    message: canRespond
      ? "응답 가능합니다."
      : isDesignatedRequest
        ? "지정된 모든 기사님이 응답하셨습니다."
        : "최대 5명까지 응답 가능합니다."
  };
}

type DriverWithAuthUserId = {
  id: string; // Driver의 ID
  authUserId: string; // Driver와 연결된 AuthUser의 ID
};

// 이사 서비스 가능 지역 조회
async function getDriversByRegion({ fromRegion, toRegion }: getDriversByRegionType): Promise<DriverWithAuthUserId[]> {
  // Step 1. 지역 배열 구성, 중복/undefined/null 제거
  let regions = [fromRegion, toRegion].filter((region): region is RegionType => !!region);
  // 또는 region !== undefined && region !== null

  // Step 2. 유효 값이 없으면 바로 빈 배열 반환
  if (regions.length === 0) {
    console.log("유효한 지역 정보가 없어 드라이버 조회를 생략합니다.");
    return [];
  }

  // Step 3. 중복 제거 (Set 활용)
  regions = Array.from(new Set(regions));

  console.log(`[${regions.join(", ")}] 지역의 드라이버를 조회합니다.`);

  // Step 4. 드라이버 조회
  return await prisma.driver.findMany({
    where: {
      serviceAreas: {
        some: {
          region: {
            in: regions
          }
        }
      }
    },
    select: {
      id: true,
      authUserId: true
    }
  });
}
//기사님 평균 별점 업데이트
async function updateAverageRating(driverId: string, average: number) {
  return prisma.driver.update({
    where: { id: driverId },
    data: { averageRating: parseFloat(average.toFixed(2)) } // 소수점 둘째 자리 반올림
  });
}

export default {
  getAllDrivers,
  getDriverById,
  getDriverReviews,
  updateDriver,
  getDesignatedEstimateRequests,
  getAvailableEstimateRequests,
  getAllEstimateRequests,
  findEstimateByDriverAndRequest,
  createEstimate,
  rejectEstimate,
  getMyEstimates,
  getEstimateDetail,
  getRejectedEstimateRequests,
  checkResponseLimit,
  getDriversByRegion,
  updateAverageRating
};
