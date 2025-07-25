import bcrypt from "bcrypt";
import { Customer, Driver, MoveType, RegionType, UserType } from "@prisma/client";
import { CustomError } from "../utils/customError";
import profileRepository from "../repositories/profile.repository";
import authRepository from "../repositories/auth.repository";
import authService, { TokenUserPayload } from "./auth.service";

type ProfileWithTokens = { profile: Customer | { driver: Driver }; accessToken: string; refreshToken: string };
// 고객 프로필 생성
async function createCustomerProfile(
  authUserId: string,
  data: {
    profileImage?: string;
    moveType?: MoveType[];
    currentArea: string;
  }
): Promise<ProfileWithTokens> {
  if (!authUserId) {
    throw new CustomError(400, "유저 ID가 유효하지 않습니다.");
  }

  // 유저 정보 조회
  const authUser = await authRepository.findById(authUserId);
  if (!authUser) {
    throw new CustomError(404, "사용자를 찾을 수 없습니다.");
  }

  // 유저 타입이 CUSTOMER가 아닌 경우 생성 금지
  if (authUser.userType !== UserType.CUSTOMER) {
    throw new CustomError(403, "고객이 아닌 사용자는 고객 프로필을 생성할 수 없습니다.");
  }

  // 이미 존재하는 경우 예외 처리
  const existing = await profileRepository.findCustomerByAuthUserId(authUserId);
  if (existing) throw new CustomError(409, "이미 고객 프로필이 존재합니다.");

  const newProfile = await profileRepository.createCustomerProfile({
    ...data,
    authUser: { connect: { id: authUserId } }
  });

  // 토큰 재발급을 위한 payload 생성
  const newPayload: TokenUserPayload = {
    id: authUserId,
    userType: UserType.CUSTOMER,
    customerId: newProfile.id
  };

  const { accessToken, refreshToken } = authService.generateTokens(newPayload);

  return { profile: newProfile, accessToken, refreshToken };
}

// 고객 프로필 수정 (authUser 정보도 함께 반환)
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
    moveType?: MoveType[];
    currentArea?: string;
  }
) {
  if (!authUserId) throw new CustomError(400, "유저 ID가 유효하지 않습니다.");

  // 이름 유효성 검사 (2~5자의 한글)
  if (data.name) {
    const nameRegex = /^[가-힣]{2,5}$/;
    if (!nameRegex.test(data.name)) {
      throw new CustomError(422, "이름은 2~5자의 한글만 사용 가능합니다.");
    }
  }

  // 전화번호 형식 검사 (대한민국)
  if (data.phone) {
    const phoneRegex = /^010?\d{4}?\d{4}$/;
    if (!phoneRegex.test(data.phone)) {
      throw new CustomError(422, "유효하지 않은 전화번호 형식입니다. 숫자만 입력해 주세요.");
    }
  }

  // 1. 비밀번호 변경 요청 시 유효성 검사
  if (data.newPassword) {
    if (!data.currentPassword) {
      throw new CustomError(400, "현재 비밀번호를 입력해주세요.");
    }

    if (data.newPassword !== data.passwordConfirmation) {
      throw new CustomError(422, "새 비밀번호가 일치하지 않습니다.");
    }

    const authUser = await authRepository.findById(authUserId);
    if (!authUser) {
      throw new CustomError(404, "사용자를 찾을 수 없습니다.");
    }

    if (!authUser.password) {
      // 소셜 로그인 유저 등 비밀번호가 없는 경우
      throw new CustomError(400, "비밀번호가 설정되어 있지 않은 계정입니다.");
    }

    const isPasswordValid = await bcrypt.compare(data.currentPassword, authUser.password);
    if (!isPasswordValid) {
      throw new CustomError(401, "현재 비밀번호가 일치하지 않습니다.");
    }
  }

  // 2. authUser 업데이트
  const authUserUpdateData: {
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
  } = {};

  if (data.name) authUserUpdateData.name = data.name;
  if (data.email) authUserUpdateData.email = data.email;
  if (data.phone) authUserUpdateData.phone = data.phone;
  if (data.newPassword) authUserUpdateData.password = await bcrypt.hash(data.newPassword, 10);

  if (Object.keys(authUserUpdateData).length > 0) {
    await authRepository.updateAuthUser(authUserId, authUserUpdateData);
  }

  // 3. 고객 프로필 업데이트
  const profileUpdateData: {
    profileImage?: string;
    moveType?: MoveType[];
    currentArea?: string;
  } = {};

  if (data.profileImage !== undefined) profileUpdateData.profileImage = data.profileImage;
  if (data.moveType !== undefined) profileUpdateData.moveType = data.moveType;
  if (data.currentArea !== undefined) profileUpdateData.currentArea = data.currentArea;

  if (Object.keys(profileUpdateData).length === 0) {
    throw new CustomError(400, "수정할 고객 프로필 정보가 없습니다.");
  }

  const updatedProfile = await profileRepository.updateCustomerProfile(authUserId, profileUpdateData);

  // 4. 업데이트된 authUser 정보 재조회
  const updatedAuthUser = await authRepository.findById(authUserId);
  if (!updatedAuthUser) throw new CustomError(404, "업데이트 후 사용자 정보를 찾을 수 없습니다.");

  // 5. 두 데이터를 합쳐서 반환
  return {
    authUser: updatedAuthUser
  };
}

// 고객 프로필 조회
async function getCustomerProfile(customerId: string) {
  const customer = await profileRepository.getCustomerById(customerId);
  if (!customer) throw new CustomError(404, "고객 프로필을 찾을 수 없습니다.");
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
    moveType: MoveType[];
    serviceAreas: { region: RegionType; district: string }[];
  }
): Promise<ProfileWithTokens> {
  if (!authUserId) {
    throw new CustomError(400, "유저 ID가 유효하지 않습니다.");
  }

  // 유저 정보 조회
  const authUser = await authRepository.findById(authUserId);
  if (!authUser) {
    throw new CustomError(404, "사용자를 찾을 수 없습니다.");
  }

  // 유저 타입이 DRIVER가 아닌 경우 생성 금지
  if (authUser.userType !== UserType.DRIVER) {
    throw new CustomError(403, "기사가 아닌 사용자는 기사 프로필을 생성할 수 없습니다.");
  }

  // 이미 존재하는 경우 예외 처리
  const existing = await profileRepository.findDriverByAuthUserId(authUserId);
  if (existing) throw new CustomError(409, "이미 기사 프로필이 존재합니다.");

  const newProfile = await profileRepository.createDriverProfile({
    authUser: { connect: { id: authUserId } },
    profileImage: data.profileImage,
    nickname: data.nickname,
    career: data.career,
    shortIntro: data.shortIntro,
    detailIntro: data.detailIntro,
    moveType: data.moveType,
    serviceAreas: {
      create: data.serviceAreas
    }
  });

  // 토큰 재발급을 위한 payload 생성
  const newPayload: TokenUserPayload = {
    id: authUserId,
    userType: UserType.DRIVER,
    driverId: newProfile.id
  };

  const { accessToken, refreshToken } = authService.generateTokens(newPayload);

  return { profile: { driver: newProfile }, accessToken, refreshToken };
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
    moveType?: MoveType[];
    serviceAreas?: { region: RegionType; district: string }[];
  }
) {
  if (!authUserId) {
    throw new CustomError(400, "유저 ID가 유효하지 않습니다.");
  }

  if (data.career !== undefined) {
    data.career = Number(data.career);
  }

  const driver = await profileRepository.findDriverByAuthUserId(authUserId);
  if (!driver) throw new CustomError(404, "해당 기사를 찾을 수 없습니다.");

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
  if (!driver) throw new CustomError(404, "기사 프로필을 찾을 수 없습니다.");
  return driver;
}

//기사 프로필 기본 정보 수정
async function updateDriverBasicProfile(
  authUserId: string,
  data: {
    name?: string;
    phone?: string;
    currentPassword?: string;
    newPassword?: string;
    passwordConfirmation?: string;
  }
) {
  if (!authUserId) throw new CustomError(400, "유저 ID가 유효하지 않습니다.");

  // 이름 유효성 검사 (2~5자의 한글)
  if (data.name) {
    const nameRegex = /^[가-힣]{2,5}$/;
    if (!nameRegex.test(data.name)) {
      throw new CustomError(422, "이름은 2~5자의 한글만 사용 가능합니다.");
    }
  }

  // 전화번호 형식 검사 (대한민국)
  if (data.phone) {
    const phoneRegex = /^010?\d{4}?\d{4}$/;
    if (!phoneRegex.test(data.phone)) {
      throw new CustomError(422, "유효하지 않은 전화번호 형식입니다. 숫자만 입력해 주세요.");
    }
  }

  // 1. 비밀번호 변경 요청 시 유효성 검사
  if (data.newPassword) {
    if (!data.currentPassword) {
      throw new CustomError(400, "현재 비밀번호를 입력해주세요.");
    }

    if (data.newPassword !== data.passwordConfirmation) {
      throw new CustomError(422, "새 비밀번호가 일치하지 않습니다.");
    }

    const authUser = await authRepository.findById(authUserId);
    if (!authUser) {
      throw new CustomError(404, "사용자를 찾을 수 없습니다.");
    }

    if (!authUser.password) {
      // 소셜 로그인 유저 등 비밀번호가 없는 경우
      throw new CustomError(400, "비밀번호가 설정되어 있지 않은 계정입니다.");
    }

    const isPasswordValid = await bcrypt.compare(data.currentPassword, authUser.password);
    if (!isPasswordValid) {
      throw new CustomError(401, "현재 비밀번호가 일치하지 않습니다.");
    }
  }

  // 2. authUser 업데이트
  const authUserUpdateData: {
    name?: string;
    phone?: string;
    password?: string;
  } = {};

  if (data.name) authUserUpdateData.name = data.name;
  if (data.phone) authUserUpdateData.phone = data.phone;
  if (data.newPassword) authUserUpdateData.password = await bcrypt.hash(data.newPassword, 10);

  if (Object.keys(authUserUpdateData).length > 0) {
    await authRepository.updateAuthUser(authUserId, authUserUpdateData);
  }

  // 4. 업데이트된 authUser 정보 재조회
  const updatedAuthUser = await authRepository.findById(authUserId);
  if (!updatedAuthUser) throw new CustomError(404, "업데이트 후 사용자 정보를 찾을 수 없습니다.");

  // 5. 두 데이터를 합쳐서 반환
  return {
    authUser: updatedAuthUser
  };
}

export default {
  createCustomerProfile,
  updateCustomerProfile,
  getCustomerProfile,
  createDriverProfile,
  updateDriverProfile,
  getDriverProfile,
  updateDriverBasicProfile
};
