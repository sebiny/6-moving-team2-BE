import bcrypt from "bcrypt";
import { UserType, MoveType, RegionType } from "@prisma/client";
import profileService from "./profile.service";
import profileRepository from "../repositories/profile.repository";
import authRepository from "../repositories/auth.repository";
import authService from "./auth.service";
import { CustomError } from "../utils/customError";

// 의존성 모듈들을 모의(mock) 처리합니다.
jest.mock("bcrypt");
jest.mock("../repositories/profile.repository");
jest.mock("../repositories/auth.repository");
jest.mock("./auth.service");

// 모의 처리된 모듈에 대한 타입 단언을 수행합니다.
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockedProfileRepository = profileRepository as jest.Mocked<typeof profileRepository>;
const mockedAuthRepository = authRepository as jest.Mocked<typeof authRepository>;
const mockedAuthService = authService as jest.Mocked<typeof authService>;

describe("ProfileService", () => {
  const authUserId = "user-id-123";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // createCustomerProfile 함수 테스트
  describe("createCustomerProfile", () => {
    const profileData = { currentArea: "Seoul", moveType: [MoveType.PACKING] };
    const authUser = { id: authUserId, userType: UserType.CUSTOMER };
    const newProfile = { id: "customer-profile-id", authUserId, ...profileData };
    const tokens = { accessToken: "new-access-token", refreshToken: "new-refresh-token" };

    it("고객 프로필 생성 성공 시, 프로필 정보와 토큰을 반환해야 합니다.", async () => {
      mockedAuthRepository.findById.mockResolvedValue(authUser as any);
      mockedProfileRepository.findCustomerByAuthUserId.mockResolvedValue(null);
      mockedProfileRepository.createCustomerProfile.mockResolvedValue(newProfile as any);
      mockedAuthService.generateTokens.mockReturnValue(tokens);

      const result = await profileService.createCustomerProfile(authUserId, profileData);

      expect(mockedAuthRepository.findById).toHaveBeenCalledWith(authUserId);
      expect(mockedProfileRepository.findCustomerByAuthUserId).toHaveBeenCalledWith(authUserId);
      expect(mockedProfileRepository.createCustomerProfile).toHaveBeenCalledWith({
        ...profileData,
        authUser: { connect: { id: authUserId } }
      });
      expect(mockedAuthService.generateTokens).toHaveBeenCalledWith({
        id: authUserId,
        userType: UserType.CUSTOMER,
        customerId: newProfile.id
      });
      expect(result).toEqual({ profile: newProfile, ...tokens });
    });

    it("사용자를 찾을 수 없는 경우 CustomError를 던져야 합니다.", async () => {
      mockedAuthRepository.findById.mockResolvedValue(null);
      await expect(profileService.createCustomerProfile(authUserId, profileData)).rejects.toThrow(
        new CustomError(404, "사용자를 찾을 수 없습니다.")
      );
    });

    it("사용자 타입이 고객이 아닌 경우 CustomError를 던져야 합니다.", async () => {
      mockedAuthRepository.findById.mockResolvedValue({ id: authUserId, userType: UserType.DRIVER } as any);
      await expect(profileService.createCustomerProfile(authUserId, profileData)).rejects.toThrow(
        new CustomError(403, "고객이 아닌 사용자는 고객 프로필을 생성할 수 없습니다.")
      );
    });

    it("프로필이 이미 존재하는 경우 CustomError를 던져야 합니다.", async () => {
      mockedAuthRepository.findById.mockResolvedValue(authUser as any);
      mockedProfileRepository.findCustomerByAuthUserId.mockResolvedValue(newProfile as any);
      await expect(profileService.createCustomerProfile(authUserId, profileData)).rejects.toThrow(
        new CustomError(409, "이미 고객 프로필이 존재합니다.")
      );
    });
  });

  // updateCustomerProfile 함수 테스트
  describe("updateCustomerProfile", () => {
    const updateData = { name: "새이름", profileImage: "new.jpg" };
    const updatedProfile = { id: "customer-profile-id", profileImage: "new.jpg" };
    const updatedAuthUser = { id: authUserId, name: "새이름" };

    it("프로필과 사용자 정보를 성공적으로 수정해야 합니다.", async () => {
      mockedAuthRepository.updateAuthUser.mockResolvedValue(undefined);
      mockedProfileRepository.updateCustomerProfile.mockResolvedValue(updatedProfile as any);
      mockedAuthRepository.findById.mockResolvedValue(updatedAuthUser as any);

      const result = await profileService.updateCustomerProfile(authUserId, updateData);

      expect(mockedAuthRepository.updateAuthUser).toHaveBeenCalledWith(authUserId, { name: "새이름" });
      expect(mockedProfileRepository.updateCustomerProfile).toHaveBeenCalledWith(authUserId, {
        profileImage: "new.jpg"
      });
      expect(result).toEqual({ authUser: updatedAuthUser });
    });

    it("비밀번호 변경을 성공적으로 처리해야 합니다.", async () => {
      const passwordData = {
        currentPassword: "oldPassword",
        newPassword: "newPassword123!",
        passwordConfirmation: "newPassword123!"
      };
      const authUserWithPassword = { id: authUserId, password: "hashedOldPassword" };

      mockedAuthRepository.findById.mockResolvedValueOnce(authUserWithPassword as any); // for password check
      mockedBcrypt.compare.mockResolvedValue(true);
      mockedBcrypt.hash.mockResolvedValue("hashedNewPassword");
      mockedAuthRepository.updateAuthUser.mockResolvedValue(undefined);
      // 프로필 정보는 없다고 가정
      mockedProfileRepository.updateCustomerProfile.mockResolvedValue(updatedProfile as any);
      mockedAuthRepository.findById.mockResolvedValueOnce(updatedAuthUser as any); // for final return

      await profileService.updateCustomerProfile(authUserId, { ...passwordData, profileImage: "image.jpg" });

      expect(mockedBcrypt.compare).toHaveBeenCalledWith("oldPassword", "hashedOldPassword");
      expect(mockedBcrypt.hash).toHaveBeenCalledWith("newPassword123!", 10);
      expect(mockedAuthRepository.updateAuthUser).toHaveBeenCalledWith(authUserId, { password: "hashedNewPassword" });
    });

    it("현재 비밀번호가 틀리면 CustomError를 던져야 합니다.", async () => {
      const passwordData = {
        currentPassword: "wrongPassword",
        newPassword: "newPassword123!",
        passwordConfirmation: "newPassword123!"
      };
      const authUserWithPassword = { id: authUserId, password: "hashedOldPassword" };

      mockedAuthRepository.findById.mockResolvedValue(authUserWithPassword as any);
      mockedBcrypt.compare.mockResolvedValue(false);

      await expect(profileService.updateCustomerProfile(authUserId, passwordData)).rejects.toThrow(
        new CustomError(401, "현재 비밀번호가 일치하지 않습니다.")
      );
    });

    it("수정할 프로필 정보가 없으면 CustomError를 던져야 합니다.", async () => {
      // 이 테스트는 현재 서비스 로직의 특성을 반영합니다.
      // AuthUser 정보만 수정하고 Customer 프로필 정보가 없으면 에러가 발생합니다.
      const authOnlyData = { name: "새이름" };
      mockedAuthRepository.updateAuthUser.mockResolvedValue(undefined);

      await expect(profileService.updateCustomerProfile(authUserId, authOnlyData)).rejects.toThrow(
        new CustomError(400, "수정할 고객 프로필 정보가 없습니다.")
      );
    });
  });

  // createDriverProfile 함수 테스트
  describe("createDriverProfile", () => {
    const profileData = {
      nickname: "베스트기사",
      career: 5,
      shortIntro: "빠르고 안전하게",
      detailIntro: "상세 소개입니다.",
      moveType: [MoveType.OFFICE],
      serviceAreas: [{ region: RegionType.SEOUL, district: "Gangnam" }]
    };
    const authUser = { id: authUserId, userType: UserType.DRIVER };
    const newProfile = { id: "driver-profile-id", authUserId, ...profileData };
    const tokens = { accessToken: "new-access-token", refreshToken: "new-refresh-token" };

    it("기사 프로필 생성 성공 시, 프로필 정보와 토큰을 반환해야 합니다.", async () => {
      mockedAuthRepository.findById.mockResolvedValue(authUser as any);
      mockedProfileRepository.findDriverByAuthUserId.mockResolvedValue(null);
      mockedProfileRepository.createDriverProfile.mockResolvedValue(newProfile as any);
      mockedAuthService.generateTokens.mockReturnValue(tokens);

      const result = await profileService.createDriverProfile(authUserId, profileData);

      expect(mockedProfileRepository.createDriverProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          nickname: profileData.nickname,
          authUser: { connect: { id: authUserId } }
        })
      );
      expect(mockedAuthService.generateTokens).toHaveBeenCalledWith({
        id: authUserId,
        userType: UserType.DRIVER,
        driverId: newProfile.id
      });
      expect(result).toEqual({ profile: { driver: newProfile }, ...tokens });
    });

    it("사용자 타입이 기사가 아닌 경우 CustomError를 던져야 합니다.", async () => {
      mockedAuthRepository.findById.mockResolvedValue({ id: authUserId, userType: UserType.CUSTOMER } as any);
      await expect(profileService.createDriverProfile(authUserId, profileData)).rejects.toThrow(
        new CustomError(403, "기사가 아닌 사용자는 기사 프로필을 생성할 수 없습니다.")
      );
    });
  });

  // updateDriverProfile 함수 테스트
  describe("updateDriverProfile", () => {
    const driverId = "driver-id-456";
    const updateData = { nickname: "더 베스트 기사", career: 10 };
    const serviceAreas = [{ region: RegionType.BUSAN, district: "Haeundae" }];

    it("기사 프로필 정보를 성공적으로 수정해야 합니다.", async () => {
      mockedProfileRepository.findDriverByAuthUserId.mockResolvedValue({ id: driverId } as any);
      mockedProfileRepository.updateDriverProfile.mockResolvedValue({ id: driverId, ...updateData } as any);

      const result = await profileService.updateDriverProfile(authUserId, updateData);

      expect(mockedProfileRepository.updateDriverProfile).toHaveBeenCalledWith(authUserId, updateData);
      expect(mockedProfileRepository.deleteDriverServiceAreas).not.toHaveBeenCalled();
      expect(result.nickname).toBe(updateData.nickname);
    });

    it("서비스 지역 정보를 성공적으로 수정해야 합니다.", async () => {
      mockedProfileRepository.findDriverByAuthUserId.mockResolvedValue({ id: driverId } as any);
      mockedProfileRepository.deleteDriverServiceAreas.mockResolvedValue(undefined);
      mockedProfileRepository.createDriverServiceAreas.mockResolvedValue(undefined);
      mockedProfileRepository.updateDriverProfile.mockResolvedValue({ id: driverId, ...updateData } as any);

      await profileService.updateDriverProfile(authUserId, { ...updateData, serviceAreas });

      expect(mockedProfileRepository.deleteDriverServiceAreas).toHaveBeenCalledWith(driverId);
      expect(mockedProfileRepository.createDriverServiceAreas).toHaveBeenCalledWith(
        serviceAreas.map((area) => ({ ...area, driverId }))
      );
    });

    it("기사 프로필을 찾을 수 없는 경우 CustomError를 던져야 합니다.", async () => {
      mockedProfileRepository.findDriverByAuthUserId.mockResolvedValue(null);
      await expect(profileService.updateDriverProfile(authUserId, updateData)).rejects.toThrow(
        new CustomError(404, "해당 기사를 찾을 수 없습니다.")
      );
    });
  });

  // updateDriverBasicProfile 함수 테스트
  describe("updateDriverBasicProfile", () => {
    const updateData = { name: "기사 새이름" };
    const updatedAuthUser = { id: authUserId, name: "기사 새이름" };

    it("기사 기본 정보를 성공적으로 수정해야 합니다.", async () => {
      mockedAuthRepository.updateAuthUser.mockResolvedValue(undefined);
      mockedAuthRepository.findById.mockResolvedValue(updatedAuthUser as any);

      const result = await profileService.updateDriverBasicProfile(authUserId, updateData);

      expect(mockedAuthRepository.updateAuthUser).toHaveBeenCalledWith(authUserId, { name: "기사 새이름" });
      expect(result).toEqual({ authUser: updatedAuthUser });
    });

    it("비밀번호 변경을 성공적으로 처리해야 합니다.", async () => {
      const passwordData = {
        currentPassword: "oldPassword",
        newPassword: "newPassword123!",
        passwordConfirmation: "newPassword123!"
      };
      const authUserWithPassword = { id: authUserId, password: "hashedOldPassword" };

      mockedAuthRepository.findById.mockResolvedValueOnce(authUserWithPassword as any); // for password check
      mockedBcrypt.compare.mockResolvedValue(true);
      mockedBcrypt.hash.mockResolvedValue("hashedNewPassword");
      mockedAuthRepository.updateAuthUser.mockResolvedValue(undefined);
      mockedAuthRepository.findById.mockResolvedValueOnce(updatedAuthUser as any); // for final return

      await profileService.updateDriverBasicProfile(authUserId, passwordData);

      expect(mockedBcrypt.compare).toHaveBeenCalledWith("oldPassword", "hashedOldPassword");
      expect(mockedBcrypt.hash).toHaveBeenCalledWith("newPassword123!", 10);
      expect(mockedAuthRepository.updateAuthUser).toHaveBeenCalledWith(authUserId, { password: "hashedNewPassword" });
    });

    it("사용자를 찾을 수 없는 경우 CustomError를 던져야 합니다.", async () => {
      const passwordData = { newPassword: "newPassword123!" };
      mockedAuthRepository.findById.mockResolvedValue(null);

      await expect(profileService.updateDriverBasicProfile(authUserId, passwordData)).rejects.toThrow(
        new CustomError(404, "사용자를 찾을 수 없습니다.")
      );
    });
  });
});
