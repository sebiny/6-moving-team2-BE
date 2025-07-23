import { MoveType, RegionType } from "@prisma/client";
import prisma from "../config/prisma";

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
      OR: [
        { nickname: { contains: keyword, mode: "insensitive" } },
        { shortIntro: { contains: keyword, mode: "insensitive" } }
      ],
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

// 기사님이 받은 견적 요청 리스트 조회 (고객이 기사에게 직접 요청한 것만)
async function getEstimateRequestsForDriver(driverId: string) {
  // 지정 견적 요청 (DesignatedDriver)만 조회
  return await prisma.estimateRequest.findMany({
    where: {
      designatedDrivers: {
        some: { driverId }
      },
      deletedAt: null
    },
    include: {
      customer: true,
      fromAddress: true,
      toAddress: true
    }
  });
}

//기사님 프로필 업데이트
async function updateDriver(id: string, data: EditDataType) {
  return await prisma.authUser.update({ where: { id }, data });
}

export default {
  getAllDrivers,
  getDriverById,
  getDriverReviews,
  updateDriver,
  getEstimateRequestsForDriver
};
