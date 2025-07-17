import addressRepository from "../repositories/address.repository";
import { CreateAddressInput } from "../types/estimateReq.type";

// DB에 주소 등록
async function createAddress(data: CreateAddressInput) {
  const { postalCode, street, detail } = data;

  const existing = await addressRepository.findAddressByFields(postalCode, street, detail);
  if (existing) return existing;

  return addressRepository.createAddress(data);
}

export default {
  createAddress
};
