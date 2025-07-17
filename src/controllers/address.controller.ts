import { Request, Response } from "express";
import addressService from "../services/address.service";
import { asyncHandler } from "../utils/asyncHandler";
import { CustomError } from "../utils/customError";

// 주소 등록
const createAddress = asyncHandler(async (req: Request, res: Response) => {
  const { postalCode, street, detail, region, district } = req.body;

  if (!postalCode || !street || !region || !district) {
    throw new CustomError(400, "필수 주소 정보가 누락되었습니다.");
  }

  const address = await addressService.createAddress({
    postalCode,
    street,
    detail,
    region,
    district
  });

  res.status(201).json(address);
});

export default {
  createAddress
};
