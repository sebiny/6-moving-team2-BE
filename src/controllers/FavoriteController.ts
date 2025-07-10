import favoriteService from '../services/FavoriteService';
import { asyncHandler } from '../utils/AsyncHandler';
import { Request, Response } from 'express';

const getAllFavoriteDrivers = asyncHandler(async (req: Request, res: Response) => {
  const userId = 'cmcu92tcw0001s6kir546aok5'; //미들웨어
  const result = await favoriteService.getAllFavoriteDrivers(userId);
  res.status(200).json(result);
});

const createFavorite = asyncHandler(async (req: Request, res: Response) => {
  const userId = 'cmcu92tcw0001s6kir546aok5'; //미들웨어
  const { id: driverId } = req.params;
  const result = await favoriteService.createFavorite(driverId, userId);
  res.status(201).json(result);
});

const deleteFavorite = asyncHandler(async (req: Request, res: Response) => {
  const userId = 'cmcu92tcw0001s6kir546aok5'; //미들웨어
  const { id: driverId } = req.params;
  const result = await favoriteService.deleteFavorite(driverId, userId);
  res.status(204).json(result);
});

export default {
  getAllFavoriteDrivers,
  createFavorite,
  deleteFavorite
};
