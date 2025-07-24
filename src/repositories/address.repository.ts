import { RegionType } from "@prisma/client";
import prisma from "../config/prisma";
import { CreateAddressInput } from "../types/estimateReq.type";

// DB에 주소 등록
async function createAddress(data: CreateAddressInput) {
  return prisma.address.create({ data });
}

// 주소 중복 체크
async function findAddressByFields(postalCode: string, street: string, detail?: string | null) {
  return prisma.address.findFirst({
    where: {
      postalCode,
      street,
      ...(detail !== undefined ? { detail } : {})
    }
  });
}

// 이사 서비스 지역 조회
async function getRegionByAddress(
  fromAddressId: string,
  toAddressId: string
): Promise<Array<{ region?: string; district?: string }>> {
  const fromRegion = await prisma.address.findUnique({
    where: { id: fromAddressId },
    select: { region: true, district: true }
  });

  const toRegion = await prisma.address.findUnique({
    where: { id: toAddressId },
    select: { region: true, district: true }
  });

  console.log("DB에서 조회한 출발지 정보:", fromRegion);
  console.log("DB에서 조회한 도착지 정보:", toRegion);

  return [
    { region: fromRegion?.region, district: fromRegion?.district },
    { region: toRegion?.region, district: toRegion?.district }
  ];
}

export default {
  createAddress,
  findAddressByFields,
  getRegionByAddress
};
