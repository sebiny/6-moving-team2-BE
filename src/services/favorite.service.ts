import favoriteRepository from "../repositories/favorite.repository";

async function getAllFavoriteDrivers(userId: string, page?: number | null, pageSize?: number | null) {
  return await favoriteRepository.getAllFavoriteDrivers(userId, page, pageSize);
}

async function createFavorite(driverId: string, customerId: string) {
  return await favoriteRepository.createFavorite(driverId, customerId);
}

async function deleteFavorite(driverId: string, customerId: string) {
  return await favoriteRepository.deleteFavorite(driverId, customerId);
}

export default {
  getAllFavoriteDrivers,
  createFavorite,
  deleteFavorite
};
