import { RegionType } from "@prisma/client";
import { CustomError } from "../utils/customError";
import addressRepository from "../repositories/address.repository";
import { CreateAddressInput } from "../types/estimateReq.type";

// DB에 주소 등록
async function createAddress(data: CreateAddressInput) {
  if (!Object.values(RegionType).includes(data.region)) {
    throw new CustomError(400, "지원하지 않는 지역입니다.");
  }

  const postalCode = data.postalCode?.trim();
  const street = data.street?.trim();
  const detailRaw = data.detail;
  const detail = detailRaw === undefined || detailRaw === null ? detailRaw : detailRaw.trim();

  const existing = await addressRepository.findAddressByFields(postalCode, street, detail);
  if (existing) return existing;

  return addressRepository.createAddress({
    ...data,
    postalCode,
    street,
    detail
  });
}

export default {
  createAddress
};
