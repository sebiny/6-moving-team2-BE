import driverService from "../services/driver.service";
import { asyncHandler } from "../utils/asyncHandler";
import { Request, Response } from "express";

const getAllDrivers = asyncHandler(async (req: Request, res: Response) => {
  const result = await driverService.getAllDrivers();
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
