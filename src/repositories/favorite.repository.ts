import prisma from '../config/prisma';

async function getAllFavoriteDrivers(userId: string) {
  return await prisma.favorite.findMany({ where: { customerId: userId } });
}

async function createFavorite(driverId: string, customerId: string) {
  return await prisma.favorite.create({ data: { customerId, driverId } });
}

async function deleteFavorite(driverId: string, customerId: string) {
  return prisma.favorite.delete({ where: { customerId_driverId: { driverId, customerId } } });
}

export default {
  getAllFavoriteDrivers,
  createFavorite,
  deleteFavorite
};
