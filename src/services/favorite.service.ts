import favoriteRepository from "../repositories/favorite.repository";
import { CustomError } from "../utils/customError";

async function getAllFavoriteDrivers(userId: string, pageSize?: number | null) {
  return await favoriteRepository.getAllFavoriteDrivers(userId, pageSize);
}

async function createFavorite(driverId: string, customerId: string) {
  try {
    return await favoriteRepository.createFavorite(driverId, customerId);
  } catch (e: any) {
    if (e.code === "P2002") throw new CustomError(409, "이미 찜한 기사님입니다.");
    throw new CustomError(500, "찜하기에 실패하였습니다.");
  }
}

async function deleteFavorite(driverId: string, customerId: string) {
  try {
    return await favoriteRepository.deleteFavorite(driverId, customerId);
  } catch (e: any) {
    if (e.code === "P2025") {
      throw new CustomError(404, "찜 정보가 존재하지 않습니다.");
    }
    throw new CustomError(500, "찜 취소에 실패하였습니다.");
  }
}

export default {
  getAllFavoriteDrivers,
  createFavorite,
  deleteFavorite
};
