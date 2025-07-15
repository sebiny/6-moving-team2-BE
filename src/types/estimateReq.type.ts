import { AddressRole, MoveType, RegionType, RequestStatus } from "@prisma/client";

// 주소 타입
export type CreateAddressInput = {
  postalCode: string;
  street: string;
  detail?: string;
  region: RegionType;
  district: string;
};

// 고객 주소 타입
export type LinkCustomerAddressInput = {
  customerId: string;
  addressId: string;
  role: AddressRole;
};

// 견적 요청 타입
export type CreateEstimateRequestInput = {
  customerId: string;
  moveType: MoveType; // 'HOME' | 'OFFICE' | 'SMALL'
  moveDate: Date;
  fromAddressId: string;
  toAddressId: string;
  status: RequestStatus; // 기본값: PENDING
};
