import bcrypt from 'bcrypt';
import { MoveType, RegionType } from '@prisma/client';
import { CustomError } from '../utils/CustomError';
import profileRepository from '../repositories/ProfileRepository';
import authRepository from '../repositories/AuthRepository';

// 고객 프로필 생성
async function createCustomerProfile(
  authUserId: string,
  data: {
    profileImage?: string;
    moveType?: MoveType;
    currentArea?: string;
  }
) {
  if (!authUserId) {
    throw new CustomError(400, '유저 ID가 유효하지 않습니다.');
  }

  const existing = await profileRepository.findCustomerByAuthUserId(authUserId);
  if (existing) throw new CustomError(409, '이미 고객 프로필이 존재합니다.');

  return await profileRepository.createCustomerProfile({
    ...data,
    authUser: { connect: { id: authUserId } }
  });
}

// 고객 프로필 수정
async function updateCustomerProfile(
  authUserId: string,
  data: {
    name?: string;
    email?: string;
    phone?: string;
    currentPassword?: string;
    newPassword?: string;
    passwordConfirmation?: string;
    profileImage?: string;
    moveType?: MoveType;
    currentArea?: string;
  }
) {
  if (!authUserId) {
    throw new CustomError(400, '유저 ID가 유효하지 않습니다.');
  }

  // 1. 비밀번호 변경 요청 시 유효성 검사
  if (data.newPassword) {
    if (!data.currentPassword) {
      throw new CustomError(400, '현재 비밀번호를 입력해주세요.');
    }

    if (data.newPassword !== data.passwordConfirmation) {
      throw new CustomError(422, '새 비밀번호가 일치하지 않습니다.');
    }

    const authUser = await authRepository.findById(authUserId);
    if (!authUser) {
      throw new CustomError(404, '사용자를 찾을 수 없습니다.');
    }

    if (!authUser.password) {
      // 소셜 로그인 유저 등 비밀번호가 없는 경우
      throw new CustomError(400, '비밀번호가 설정되어 있지 않은 계정입니다.');
    }

    const isPasswordValid = await bcrypt.compare(data.currentPassword, authUser.password);
    if (!isPasswordValid) {
      throw new CustomError(401, '현재 비밀번호가 일치하지 않습니다.');
    }
  }

  // 2. AuthUser 업데이트
  const { name, email, phone, newPassword } = data;
  if (name || email || phone || newPassword) {
    const updateData: {
      name?: string;
      email?: string;
      phone?: string;
      password?: string;
    } = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (newPassword) {
      const hashed = await bcrypt.hash(newPassword, 10);
      updateData.password = hashed;
    }

    await authRepository.updateAuthUser(authUserId, updateData);
  }

  // 3. Customer 프로필 업데이트
  const { profileImage, moveType, currentArea } = data;
  return await profileRepository.updateCustomerProfile(authUserId, {
    profileImage,
    moveType,
    currentArea
  });
}

// 고객 프로필 조회
async function getCustomerProfile(customerId: string) {
  const customer = await profileRepository.getCustomerById(customerId);
  if (!customer) throw new CustomError(404, '고객 프로필을 찾을 수 없습니다.');
  return customer;
}

// 기사 프로필 생성
async function createDriverProfile(
  authUserId: string,
  data: {
    profileImage?: string;
    nickname: string;
    career: number;
    shortIntro: string;
    detailIntro: string;
    services: string[];
    serviceAreas: { region: RegionType; district: string }[];
  }
) {
  if (!authUserId) {
    throw new CustomError(400, '유저 ID가 유효하지 않습니다.');
  }

  const existing = await profileRepository.findDriverByAuthUserId(authUserId);
  if (existing) throw new CustomError(409, '이미 기사 프로필이 존재합니다.');

  return await profileRepository.createDriverProfile({
    authUser: { connect: { id: authUserId } },
    profileImage: data.profileImage,
    nickname: data.nickname,
    career: data.career,
    shortIntro: data.shortIntro,
    detailIntro: data.detailIntro,
    services: data.services,
    serviceAreas: data.serviceAreas
      ? {
          create: data.serviceAreas
        }
      : undefined
  });
}

// 기사 프로필 수정
async function updateDriverProfile(
  authUserId: string,
  data: {
    profileImage?: string;
    nickname?: string;
    career?: number;
    shortIntro?: string;
    detailIntro?: string;
    services?: string[];
    serviceAreas?: { region: RegionType; district: string }[];
  }
) {
  if (!authUserId) {
    throw new CustomError(400, '유저 ID가 유효하지 않습니다.');
  }

  if (data.career !== undefined) {
    data.career = Number(data.career);
  }

  const driver = await profileRepository.findDriverByAuthUserId(authUserId);
  if (!driver) throw new CustomError(404, '해당 기사를 찾을 수 없습니다.');

  if (data.serviceAreas) {
    await profileRepository.deleteDriverServiceAreas(driver.id);

    const serviceAreasInput = data.serviceAreas.map((area) => ({
      driverId: driver.id,
      region: area.region,
      district: area.district
    }));

    await profileRepository.createDriverServiceAreas(serviceAreasInput);
  }

  const { serviceAreas, ...rest } = data;
  return await profileRepository.updateDriverProfile(authUserId, rest);
}

// 기사 프로필 조회
async function getDriverProfile(driverId: string) {
  const driver = await profileRepository.getDriverById(driverId);
  if (!driver) throw new CustomError(404, '기사 프로필을 찾을 수 없습니다.');
  return driver;
}

export default {
  createCustomerProfile,
  updateCustomerProfile,
  getCustomerProfile,
  createDriverProfile,
  updateDriverProfile,
  getDriverProfile
};
