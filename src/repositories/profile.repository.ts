import prisma from "../config/prisma";
import type { Prisma, Customer, Driver, DriverServiceArea } from "@prisma/client";

// 고객 프로필 조회 by authUserId
async function findCustomerByAuthUserId(authUserId: string): Promise<Customer | null> {
  return prisma.customer.findUnique({
    where: { authUserId },
    include: {
      authUser: true
    }
  });
}

// 고객 프로필 생성
async function createCustomerProfile(data: Prisma.CustomerCreateInput): Promise<Customer> {
  return prisma.customer.create({ data });
}

// 고객 프로필 수정
async function updateCustomerProfile(authUserId: string, data: Prisma.CustomerUpdateInput): Promise<Customer> {
  return prisma.customer.update({
    where: { authUserId },
    data,
    include: {
      authUser: true
    }
  });
}
// // 고객 프로필 조회 by customerId (id 직접 조회)
// async function getCustomerById(id: string): Promise<Customer | null> {
//   return prisma.customer.findUnique({
//     where: { id },
//     include: {
//       authUser: true
//     }
//   });
// }

// 기사 프로필 조회 by authUserId
async function findDriverByAuthUserId(authUserId: string): Promise<Driver | null> {
  return prisma.driver.findUnique({
    where: { authUserId },
    include: {
      serviceAreas: true // 기사 서비스 지역도 포함
    }
  });
}

// 기사 프로필 조회 by nickname
async function findDriverByNickname(
  nickname: string
): Promise<{ id: string; authUserId: string; nickname: string } | null> {
  return prisma.driver.findFirst({
    where: { nickname },
    select: { id: true, authUserId: true, nickname: true }
  });
}

// 기사 프로필 생성
async function createDriverProfile(data: Prisma.DriverCreateInput): Promise<Driver> {
  return prisma.driver.create({
    data,
    include: {
      serviceAreas: true
    }
  });
}

// 기사 프로필 수정
async function updateDriverProfile(authUserId: string, data: Prisma.DriverUpdateInput): Promise<Driver> {
  return prisma.driver.update({
    where: { authUserId },
    data
  });
}

// // 기사 프로필 조회 by driverId (id 직접 조회)
// async function getDriverById(id: string): Promise<Driver | null> {
//   return prisma.driver.findUnique({
//     where: { id },
//     include: {
//       serviceAreas: true
//     }
//   });
// }

// 기존 기사 서비스 지역 삭제
async function deleteDriverServiceAreas(driverId: string): Promise<void> {
  await prisma.driverServiceArea.deleteMany({
    where: { driverId }
  });
}

// 기사 서비스 지역 일괄 생성
async function createDriverServiceAreas(data: Prisma.DriverServiceAreaCreateManyInput[]): Promise<void> {
  await prisma.driverServiceArea.createMany({ data });
}

export default {
  findCustomerByAuthUserId,
  createCustomerProfile,
  updateCustomerProfile,
  // getCustomerById,
  findDriverByAuthUserId,
  createDriverProfile,
  updateDriverProfile,
  // getDriverById,
  deleteDriverServiceAreas,
  createDriverServiceAreas,
  findDriverByNickname
};
