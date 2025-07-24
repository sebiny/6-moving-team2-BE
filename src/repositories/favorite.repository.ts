import prisma from "../config/prisma";

//찜한 기사님 불러오기
async function getAllFavoriteDrivers(userId: string, page: number, pageSize: number) {
  const skip = (page - 1) * pageSize;
  const favoriteDrivers = await prisma.favorite.findMany({
    where: { customerId: userId },
    skip: skip,
    take: pageSize,
    include: { driver: { include: { _count: { select: { reviewsReceived: true, favorite: true } } } } }
  });
  const data = favoriteDrivers.map((favorite) => {
    const { driver } = favorite;
    return {
      ...driver,
      reviewCount: driver._count.reviewsReceived,
      favoriteCount: driver._count.favorite
    };
  });

  return data;
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
