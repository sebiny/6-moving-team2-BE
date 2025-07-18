import { MoveType, RegionType } from "@prisma/client";
import { optionsType } from "../repositories/driver.repository";
import driverService from "../services/driver.service";
import { asyncHandler } from "../utils/asyncHandler";
import { Request, Response } from "express";

const getAllDrivers = asyncHandler(async (req: Request, res: Response) => {
  const { keyword, orderBy, region, service, page } = req.query;
  const options = {
    keyword: keyword as string,
    orderBy: orderBy as "reviewCount" | "career" | "work", //| "rating";,
    region: region as RegionType,
    service: service as MoveType[],
    page: Number(page) as number
  };
  const result = await driverService.getAllDrivers(options);
  res.status(200).json(result);
});

const getDriverById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await driverService.getDriverById(id);
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
  updateDriver
};
