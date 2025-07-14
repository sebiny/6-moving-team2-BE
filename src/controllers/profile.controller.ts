import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { CustomError } from "../utils/customError";
import profileService from "../services/profile.service";
import { UserType } from "@prisma/client";

declare global {
  namespace Express {
    interface User {
      id: string;
      userType: UserType;
    }
  }
}

// 고객 프로필 생성
const createCustomerProfile = asyncHandler(async (req: Request, res: Response) => {
  const authUserId = req.user?.id;

  if (!authUserId) throw new CustomError(401, "인증 정보가 없습니다.");

  const { profileImage, moveType, currentArea } = req.body;

  const profile = await profileService.createCustomerProfile(authUserId, {
    profileImage,
    moveType,
    currentArea
  });

  res.status(201).json(profile);
});

// 고객 프로필 수정
const updateCustomerProfile = asyncHandler(async (req: Request, res: Response) => {
  const authUserId = req.user?.id;

  if (!authUserId) throw new CustomError(401, "인증 정보가 없습니다.");

  const {
    name,
    email,
    phone,
    currentPassword,
    newPassword,
    passwordConfirmation,
    profileImage,
    moveType,
    currentArea
  } = req.body;

  const updated = await profileService.updateCustomerProfile(authUserId, {
    name,
    email,
    phone,
    currentPassword,
    newPassword,
    passwordConfirmation,
    profileImage,
    moveType,
    currentArea
  });

  res.json(updated);
});

// 고객 프로필 조회
const getCustomerProfile = asyncHandler(async (req: Request, res: Response) => {
  const customerId = req.params.id;
  const profile = await profileService.getCustomerProfile(customerId);
  res.json(profile);
});

// 기사 프로필 생성
const createDriverProfile = asyncHandler(async (req: Request, res: Response) => {
  const authUserId = req.user?.id;

  if (!authUserId) throw new CustomError(401, "인증 정보가 없습니다.");

  const { profileImage, nickname, career, shortIntro, detailIntro, moveType, serviceAreas } = req.body;

  const result = await profileService.createDriverProfile(authUserId, {
    profileImage,
    nickname,
    career,
    shortIntro,
    detailIntro,
    moveType,
    serviceAreas
  });

  res.status(201).json(result);
});

// 기사 프로필 수정
const updateDriverProfile = asyncHandler(async (req: Request, res: Response) => {
  const authUserId = req.user?.id;

  if (!authUserId) throw new CustomError(401, "인증 정보가 없습니다.");

  const { profileImage, nickname, career, shortIntro, detailIntro, moveType, serviceAreas } = req.body;

  const updated = await profileService.updateDriverProfile(authUserId, {
    profileImage,
    nickname,
    career,
    shortIntro,
    detailIntro,
    moveType,
    serviceAreas
  });

  res.json(updated);
});

// 기사 프로필 조회
const getDriverProfile = asyncHandler(async (req: Request, res: Response) => {
  const driverId = req.params.id;
  const profile = await profileService.getDriverProfile(driverId);
  res.json(profile);
});

export default {
  createCustomerProfile,
  updateCustomerProfile,
  getCustomerProfile,
  createDriverProfile,
  updateDriverProfile,
  getDriverProfile
};
