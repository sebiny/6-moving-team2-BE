import { MoveType, RegionType } from "@prisma/client";
import driverService from "../services/driver.service";
import { asyncHandler } from "../utils/asyncHandler";
import { Request, Response } from "express";

const getAllDrivers = asyncHandler(async (req: Request, res: Response) => {
  const { keyword, orderBy, region, service, page } = req.query;
  const customerId = req.user?.customerId;
  const options = {
    keyword: keyword as string,
    orderBy: orderBy as "reviewCount" | "career" | "work" | "averageRating",
    region: region as RegionType,
    service: service as MoveType[],
    page: Number(page) as number
  };
  const result = await driverService.getAllDrivers(options, customerId);
  res.status(200).json(result);
});

const getDriverById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const customerId = req.user?.customerId;
  const result = await driverService.getDriverById(id, customerId);
  res.status(200).json(result);
});

const getDriverReviews = asyncHandler(async (req: Request, res: Response) => {
  const { page } = req.query;
  const { id } = req.params;
  const result = await driverService.getDriverReviews(id, Number(page));
  res.status(200).json(result);
});

const updateDriver = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body;
  const result = await driverService.updateDriver(id, data);
  res.status(200).json(result);
});

export default {
  getAllDrivers,
  getDriverById,
  getDriverReviews,
  updateDriver
};
