import prisma from "../config/prisma";

//찜한 기사님 불러오기
async function getAllFavoriteDrivers(userId: string) {
  return await prisma.favorite.findMany({ where: { customerId: userId } });
}

//찜하기
async function createFavorite(driverId: string, customerId: string) {
  return await prisma.favorite.create({ data: { customerId, driverId } });
}

//찜하기 삭제
async function deleteFavorite(driverId: string, customerId: string) {
  return prisma.favorite.delete({ where: { customerId_driverId: { driverId, customerId } } });
}

export default {
  getAllFavoriteDrivers,
  createFavorite,
  deleteFavorite
};
