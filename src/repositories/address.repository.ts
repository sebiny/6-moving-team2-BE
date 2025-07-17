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

export default {
  createAddress,
  findAddressByFields
};
