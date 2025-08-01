import favoriteService from "../services/favorite.service";
import { asyncHandler } from "../utils/asyncHandler";
import { Request, Response } from "express";
import { CustomError } from "../utils/customError";

const getAllFavoriteDrivers = asyncHandler(async (req: Request, res: Response) => {
  const customerId = req.user?.customerId;
  if (!customerId) throw new CustomError(401, "인증 정보가 없습니다.");
  const pageSize = Number(req.query.pageSize);

  const result = await favoriteService.getAllFavoriteDrivers(customerId, isNaN(pageSize) ? null : pageSize);
  res.status(200).json(result);
});

const createFavorite = asyncHandler(async (req: Request, res: Response) => {
  const customerId = req.user?.customerId;
  if (!customerId) throw new CustomError(401, "인증 정보가 없습니다.");
  const { id: driverId } = req.params;
  const result = await favoriteService.createFavorite(driverId, customerId);
  res.status(201).json(result);
});

const deleteFavorite = asyncHandler(async (req: Request, res: Response) => {
  const customerId = req.user?.customerId;
  if (!customerId) throw new CustomError(401, "인증 정보가 없습니다.");
  const { id: driverId } = req.params;
  const result = await favoriteService.deleteFavorite(driverId, customerId);
  res.status(204).json(result);
});

export default {
  getAllFavoriteDrivers,
  createFavorite,
  deleteFavorite
};
