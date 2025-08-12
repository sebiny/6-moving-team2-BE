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
      ? [{ reviewsReceived: { _count: "desc" as const } }, { id: "asc" as const }]
      : [{ [orderBy]: "desc" as const }, { id: "asc" as const }];

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
      _count: {
        select: {
          reviewsReceived: {
            where: { deletedAt: null }
          },
          favorite: true
        }
      },
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
      _count: {
        select: {
          reviewsReceived: {
            where: { deletedAt: null }
          },
          favorite: true
        }
      },
      serviceAreas: true,
      favorite: userId ? { where: { customerId: userId }, select: { id: true } } : false
    }
  });

  if (!driver) return null;

  const ratingCounts = await prisma.review.groupBy({
    by: ["rating"],
    where: { driverId: id, deletedAt: null },
    _count: true
  });
  const ratingStats: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  ratingCounts.forEach((item) => {
    ratingStats[item.rating] = item._count;
  });

  const isFavorite = userId ? driver.favorite.length > 0 : false;
  const { favorite, _count, ...rest } = driver;
  return { ...rest, isFavorite, reviewCount: _count.reviewsReceived, favoriteCount: _count.favorite, ratingStats };
}

//기사님 리뷰 (페이지네이션 때문에 분리)
async function getDriverReviews(id: string, page: number) {
  const PAGE_SIZE = 5;
  const skip = (page - 1) * PAGE_SIZE;
  const reviews = await prisma.review.findMany({
    where: { driverId: id, deletedAt: null },
    skip: skip,
    take: PAGE_SIZE,
    include: { writer: { select: { authUser: { select: { email: true } } } } }
  });
  return reviews.map((review) => {
    const { writer, ...rest } = review;
    return {
      ...rest,
      email: writer.authUser.email
    };
  });
}

// 지정 견적 요청 리스트 조회 (고객이 기사에게 직접 요청한 것만)("내가" 지정된 요청)
async function getDesignatedEstimateRequests(driverId: string) {
  // 1. 모든 지정 견적 요청 조회
  const requests = await prisma.estimateRequest.findMany({
    where: {
      designatedDrivers: {
        some: { driverId }
      },
      status: "PENDING", // PENDING 상태만 조회
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
      toAddress: true,
      _count: {
        select: {
          estimates: true
        }
      }
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

  // 5. isDesignated: true 표시 및 견적 개수 포함
  return filteredRequests.map((request) => ({
    ...request,
    isDesignated: true,
    estimateCount: request._count.estimates
  }));
}

// 기사 서비스 지역의 일반 견적 요청 목록 조회 ("내가" 지정되지 않은 요청)
async function getAvailableEstimateRequests(driverId: string) {
  // 1. 기사의 서비스 가능 지역 조회
  const driverServiceAreas = await prisma.driverServiceArea.findMany({
    where: { driverId }
  });

  if (driverServiceAreas.length === 0) {
    console.log(`❌ 기사 ${driverId}의 서비스 가능 지역이 없습니다.`);
    return [];
  }

  // 2. 해당 지역의 일반 요청 조회 (지정되지 않은 요청)
  // 기사 서비스 지역과 일치하고, 상태가 PENDING인 모든 요청 조회
  const availableRequests = await prisma.estimateRequest.findMany({
    where: {
      AND: [
        {
          OR: driverServiceAreas.map((area) => ({
            OR: [{ fromAddress: { region: area.region } }, { toAddress: { region: area.region } }]
          }))
        },

        {
          designatedDrivers: {
            none: {
              driverId: driverId // 내가 지정되지 않은 요청
            }
          }
        },
        { status: "PENDING" }, // PENDING 상태만 조회
        { deletedAt: null }
      ]
    },
    include: {
      estimates: {
        select: { driverId: true } // 일반 기사 응답 수 체크(5명)
      },
      designatedDrivers: {
        select: { driverId: true } // 지정된 기사인지 체크
      },
      customer: {
        include: {
          authUser: { select: { name: true } }
        }
      },
      fromAddress: true,
      toAddress: true,
      _count: {
        select: {
          estimates: true
        }
      }
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

  // 5. 일반 기사 응답 수가 5명 미만인 요청만 필터링
  const filteredRequests = availableRequests.filter((request) => {
    const allDriverIds = request.estimates.map((e: { driverId: string }) => e.driverId);
    const designatedDriverIds = new Set(request.designatedDrivers.map((d: { driverId: string }) => d.driverId));

    // 일반 기사만 필터링
    const generalResponses = allDriverIds.filter((id: string) => !designatedDriverIds.has(id));

    return (
      generalResponses.length < 5 &&
      !respondedRequestIds.includes(request.id) &&
      !rejectedRequestIds.includes(request.id)
    );
  });

  // 일반견적 요청임을 표시 및 견적 개수 포함
  return filteredRequests.map((request) => ({
    ...request,
    isDesignated: false,
    estimateCount: request._count.estimates
  }));
}

// 기사가 받을 수 있는 모든 견적 요청 목록 조회 (지정 + 일반)
async function getAllEstimateRequests(driverId: string) {
  const [designatedRequests, availableRequests] = await Promise.all([
    getDesignatedEstimateRequests(driverId),
    getAvailableEstimateRequests(driverId)
  ]);

  // 각각 이미 isDesignated 필드가 포함되어 있으므로 그대로 합치기
  return [...designatedRequests, ...availableRequests];
}

// 특정 기사가 특정 견적 요청에 대해 보낸 견적 조회
async function findEstimateByDriverAndRequest(driverId: string, estimateRequestId: string) {
  return prisma.estimate.findFirst({
    where: { driverId, estimateRequestId, deletedAt: null }
  });
}

// 기사가 견적 요청에 대해 견적서 생성 (응답 제한 확인 포함)
async function createEstimate(data: { driverId: string; estimateRequestId: string; price: number; comment?: string }) {
  return prisma.$transaction(async (tx) => {
    // 지정 요청인지 확인
    const designatedDrivers = await tx.designatedDriver.findMany({
      where: { estimateRequestId: data.estimateRequestId }
    });

    const designatedDriverIds = designatedDrivers.map((d) => d.driverId); // 지정 기사 ID 확인
    const isDesignated = designatedDrivers.length > 0; // 현재 요청 기사가 지정 기사인지 판단

    if (isDesignated) {
      // 지정 기사일 경우: 응답 또는 반려 모두 1회만 가능
      const [estimateCount, rejectionCount] = await Promise.all([
        tx.estimate.count({
          where: {
            estimateRequestId: data.estimateRequestId,
            deletedAt: null,
            driverId: data.driverId
          }
        }),
        tx.driverEstimateRejection.count({
          where: {
            estimateRequestId: data.estimateRequestId,
            driverId: data.driverId
          }
        })
      ]);

      const total = estimateCount + rejectionCount;
      if (total >= 1) {
        throw new CustomError(400, "이미 처리된 요청입니다.");
      }
    } else {
      // 일반견적요청: 견적보내기만 5개로 제한
      const estimates = await tx.estimate.findMany({
        where: {
          estimateRequestId: data.estimateRequestId,
          deletedAt: null
        },
        select: { driverId: true }
      });

      // 일반 기사 응답만 카운트
      const normalCount = estimates.filter((e) => !designatedDriverIds.includes(e.driverId)).length;

      if (normalCount >= 5) {
        throw new CustomError(400, "이미 최대 응답 가능 기사님 수를 초과했습니다.");
      }
    }

    return tx.estimate.create({
      data: {
        ...data,
        status: "PROPOSED",
        isDesignated
      }
    });
  });
}

// 기사가 견적 요청을 거절 처리
async function rejectEstimate(estimateId: string, reason: string) {
  return prisma.estimate.update({
    where: { id: estimateId },
    data: {
      status: "REJECTED",
      rejectReason: reason
    }
  });
}

// 기사가 보낸 모든 견적 목록 조회 (최신순 정렬)
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
    // 1. 스케줄러가 업데이트한 COMPLETED 상태만 사용
    // 2. ACCEPTED 상태이면서 이사일이 지남 (주석처리)
    // 3. 이사일이 지났지만 아직 확정되지 않음 (주석처리)
    let completionStatus = null;
    let isCompleted = false;

    if (estimateRequest.status === "COMPLETED") {
      completionStatus = "COMPLETED";
      isCompleted = true;
    }
    // else if (estimate.status === "ACCEPTED" && moveDate < currentDate) {
    //   completionStatus = "CONFIRMED_AND_PAST";
    //   isCompleted = true;
    // } else if (moveDate < currentDate) {
    //   completionStatus = "DATE_PAST";
    //   isCompleted = true;
    // }

    return {
      ...estimate,
      completionStatus,
      isCompleted,
      customerName: estimateRequest.customer.authUser.name,
      isDesignated: estimate.isDesignated
    };
  });
}

// 기사가 보낸 특정 견적의 상세 정보 조회
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

// 기사가 거절한 견적 요청 목록 조회 (최신순 정렬)
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

// 견적 요청에 대한 응답 제한 확인 (일반: 5명, 지정: 지정 기사 수)
async function checkResponseLimit(estimateRequestId: string, driverId: string) {
  // 지정 요청인지 확인
  const designatedDrivers = await prisma.designatedDriver.findMany({
    where: { estimateRequestId }
  });

  const designatedDriverIds = designatedDrivers.map((d) => d.driverId);
  const isDesignated = designatedDriverIds.includes(driverId); // 현재 요청 기사가 지정 기사인지 판단

  if (isDesignated) {
    // 지정견적요청: 견적보내기 + 반려하기로 제한
    const [estimateCount, rejectionCount] = await Promise.all([
      prisma.estimate.count({
        where: {
          estimateRequestId,
          deletedAt: null,
          driverId
        }
      }),
      prisma.driverEstimateRejection.count({
        where: {
          estimateRequestId,
          driverId
        }
      })
    ]);

    const currentCount = estimateCount + rejectionCount;
    const limit = 1; // 지정 기사 1명당 1번만 응답 가능

    return {
      canRespond: currentCount < limit,
      limit,
      currentCount,
      message: currentCount < limit ? "응답 가능합니다." : "이미 처리된 요청입니다."
    };
  } else {
    // 일반견적요청: 견적보내기만 5개로 제한
    const allEstimates = await prisma.estimate.findMany({
      where: {
        estimateRequestId,
        deletedAt: null,
        status: {
          in: ["PROPOSED", "ACCEPTED"]
        }
      },
      select: { driverId: true }
    });

    // 지정 기사 제외한 일반 기사 응답 수만 필터링
    const generalEstimates = allEstimates.filter((e) => !designatedDriverIds.includes(e.driverId));
    const generalCount = generalEstimates.length;

    const limit = 5;

    return {
      canRespond: generalCount < limit,
      limit,
      currentCount: generalCount,
      message: generalCount < limit ? "응답 가능합니다." : "이미 최대 응답 가능 기사님 수를 초과했습니다."
    };
  }
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
async function updateAverageRating(driverId: string, averageRating: number) {
  const rounded = Number(averageRating.toFixed(1)); // 소수점 첫째 자리까지 반올림
  return prisma.driver.update({
    where: { id: driverId },
    data: { averageRating: rounded }
  });
}

export default {
  getAllDrivers,
  getDriverById,
  getDriverReviews,
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
