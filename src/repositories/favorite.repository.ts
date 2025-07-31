import prisma from "../config/prisma";

type FavoriteDriverWithDetails = {
  id: string;
  customerId: string;
  driverId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  driver: {
    id: string;
    nickname: string;
    shortIntro: string;
    detailIntro: string;
    moveType: string[];
    career: number;
    work: number;
    profileImage: string | null;
    authUser: {
      name: string;
    };
    _count: {
      reviewsReceived: number;
      favorite: number;
    };
  };
};

//찜한 기사님 불러오기
async function getAllFavoriteDrivers(userId: string, pageSize?: number | null) {
  const options: any = {
    where: { customerId: userId },
    include: {
      driver: {
        include: {
          authUser: true,
          _count: {
            select: {
              reviewsReceived: true,
              favorite: true
            }
          }
        }
      }
    }
  };

  if (pageSize) {
    options.take = pageSize;
  }

  const favoriteDrivers = (await prisma.favorite.findMany(options)) as FavoriteDriverWithDetails[];

  return favoriteDrivers.map((favorite) => {
    const { driver } = favorite;
    return {
      ...driver,
      reviewCount: driver._count.reviewsReceived,
      favoriteCount: driver._count.favorite
    };
  });
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
