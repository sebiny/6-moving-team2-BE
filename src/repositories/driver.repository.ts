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
  serviceArea?: RegionType;
  service?: MoveType;
};

//기사님 찾기
async function getAllDrivers(options: optionsType) {
  const { keyword, orderBy, serviceArea, service } = options;

  const orderByClause =
    orderBy === "reviewCount"
      ? {
          reviewsReceived: {
            _count: "desc" as const
          }
        }
      : { orderBy: "desc" };
  return await prisma.driver.findMany({
    where: {
      nickname: { contains: keyword, mode: "insensitive" },
      services: { has: service },
      serviceAreas: { some: { region: serviceArea } }
    },
    orderBy: orderByClause,
    include: { reviewsReceived: true }
  });
}

//기사님 상세 정보
async function getDriverById(id: string) {
  return await prisma.driver.findUnique({ where: { id } });
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
