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
  orderBy?: "reviewCount" | "career" | "work"; //| "rating";
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
  const skip = (Number(page) - 1) * PAGE_SIZE;

  const drivers = await prisma.driver.findMany({
    where: {
      OR: [
        { nickname: { contains: keyword, mode: "insensitive" } },
        { shortIntro: { contains: keyword, mode: "insensitive" } }
      ],
      ...(service && { moveType: { equals: service } }),
      ...(region && { serviceAreas: { some: { region } } })
    },
    skip: skip,
    take: PAGE_SIZE + 1, //hasNext 확인하기 위해 하나 더 가져옴
    orderBy: orderByClause,
    include: {
      reviewsReceived: true,
      serviceAreas: true,
      Favorite: userId ? { where: { customerId: userId }, select: { id: true } } : false
    }
  });

  const hasNext = drivers.length > PAGE_SIZE;
  const data = drivers.slice(0, PAGE_SIZE).map((driver) => {
    const isFavorite = userId ? driver.Favorite.length > 0 : false;
    const { Favorite, ...rest } = driver;
    return { ...rest, isFavorite };
  });

  return { data, hasNext };
}

//기사님 상세 정보
async function getDriverById(id: string, userId?: string) {
  const driver = await prisma.driver.findUnique({
    where: { id },
    include: {
      reviewsReceived: true,
      serviceAreas: true,
      Favorite: userId ? { where: { customerId: userId }, select: { id: true } } : false
    }
  });

  if (!driver) return null;
  const isFavorite = userId ? driver.Favorite.length > 1 : false;
  const { Favorite, ...rest } = driver;
  return { ...rest, isFavorite };
}

//기사님 프로필 업데이트
async function updateDriver(id: string, data: EditDataType) {
  return await prisma.authUser.update({ where: { id }, data });
}

export default {
  getAllDrivers,
  getDriverById,
  updateDriver
};
