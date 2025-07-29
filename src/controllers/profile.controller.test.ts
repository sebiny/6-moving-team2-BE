import { Request, Response, NextFunction } from "express";
import profileController from "./profile.controller";
import profileService from "../services/profile.service";
import { CustomError } from "../utils/customError";
import { UserType, MoveType, RegionType } from "@prisma/client";

// profile.service 모듈을 모의(mock) 처리합니다.
jest.mock("../services/profile.service");

// 모의 처리된 모듈에 대한 타입 단언을 수행합니다.
const mockedProfileService = profileService as jest.Mocked<typeof profileService>;

describe("ProfileController", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    // 각 테스트가 실행되기 전에 모의 객체를 초기화합니다.
    jest.clearAllMocks();

    mockRequest = {
      body: {},
      user: undefined,
      file: undefined
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
  });

  // uploadProfileImage 함수 테스트
  describe("uploadProfileImage", () => {
    it("이미지 업로드 성공 시 201 상태 코드와 이미지 URL을 반환해야 합니다.", async () => {
      mockRequest.file = { location: "http://example.com/image.jpg" };

      await profileController.uploadProfileImage(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "프로필 이미지가 성공적으로 업로드되었습니다.",
        imageUrl: "http://example.com/image.jpg"
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("업로드된 파일이 없는 경우 CustomError와 함께 next를 호출해야 합니다.", async () => {
      mockRequest.file = undefined;

      await profileController.uploadProfileImage(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(new CustomError(400, "업로드할 프로필 이미지가 없습니다."));
    });
  });

  // createCustomerProfile 함수 테스트
  describe("createCustomerProfile", () => {
    const customerProfileData = {
      profileImage: "image.jpg",
      moveType: [MoveType.PACKING],
      currentArea: "Seoul"
    };
    const serviceResult = {
      profile: { id: "cust-profile-id", ...customerProfileData },
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token"
    };

    it("고객 프로필 생성 성공 시 토큰과 함께 프로필 정보를 반환해야 합니다.", async () => {
      mockRequest.user = { id: "user-id", userType: UserType.CUSTOMER };
      mockRequest.body = customerProfileData;
      mockedProfileService.createCustomerProfile.mockResolvedValue(serviceResult as any);

      await profileController.createCustomerProfile(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockedProfileService.createCustomerProfile).toHaveBeenCalledWith("user-id", customerProfileData);
      expect(mockResponse.cookie).toHaveBeenCalledWith("refreshToken", serviceResult.refreshToken, {
        httpOnly: true,
        path: "/",
        sameSite: "none",
        secure: true
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        profile: serviceResult.profile,
        accessToken: serviceResult.accessToken
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("인증되지 않은 경우 CustomError와 함께 next를 호출해야 합니다.", async () => {
      mockRequest.user = undefined;

      await profileController.createCustomerProfile(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(new CustomError(401, "인증 정보가 없습니다."));
    });
  });

  // updateCustomerProfile 함수 테스트
  describe("updateCustomerProfile", () => {
    const updateData = { name: "New Name" };
    const updatedProfile = { authUser: { id: "user-id", name: "New Name" } };

    it("고객 프로필 수정 성공 시 수정된 데이터를 반환해야 합니다.", async () => {
      mockRequest.user = { id: "user-id", userType: UserType.CUSTOMER };
      mockRequest.body = updateData;
      mockedProfileService.updateCustomerProfile.mockResolvedValue(updatedProfile as any);

      await profileController.updateCustomerProfile(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockedProfileService.updateCustomerProfile).toHaveBeenCalledWith("user-id", expect.any(Object));
      expect(mockResponse.json).toHaveBeenCalledWith(updatedProfile);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("인증되지 않은 경우 CustomError와 함께 next를 호출해야 합니다.", async () => {
      mockRequest.user = undefined;

      await profileController.updateCustomerProfile(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(new CustomError(401, "인증 정보가 없습니다."));
    });
  });

  // createDriverProfile 함수 테스트
  describe("createDriverProfile", () => {
    const driverProfileData = {
      profileImage: "driver.jpg",
      nickname: "Best Driver",
      career: 5,
      shortIntro: "I am the best.",
      detailIntro: "I am the best driver in the world.",
      moveType: [MoveType.OFFICE],
      serviceAreas: [{ region: RegionType.SEOUL, district: "Gangnam" }]
    };
    const serviceResult = {
      profile: { id: "driver-profile-id", ...driverProfileData },
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token"
    };

    it("기사 프로필 생성 성공 시 토큰과 함께 프로필 정보를 반환해야 합니다.", async () => {
      mockRequest.user = { id: "user-id", userType: UserType.DRIVER };
      mockRequest.body = driverProfileData;
      mockedProfileService.createDriverProfile.mockResolvedValue(serviceResult as any);

      await profileController.createDriverProfile(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockedProfileService.createDriverProfile).toHaveBeenCalledWith("user-id", driverProfileData);
      expect(mockResponse.cookie).toHaveBeenCalledWith("refreshToken", serviceResult.refreshToken, {
        httpOnly: true,
        path: "/",
        sameSite: "none",
        secure: true
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        profile: serviceResult.profile,
        accessToken: serviceResult.accessToken
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  // updateDriverProfile 함수 테스트
  describe("updateDriverProfile", () => {
    const updateData = { nickname: "Even Better Driver" };
    const updatedProfile = { id: "driver-profile-id", nickname: "Even Better Driver" };

    it("기사 프로필 수정 성공 시 수정된 데이터를 반환해야 합니다.", async () => {
      mockRequest.user = { id: "user-id", userType: UserType.DRIVER };
      mockRequest.body = updateData;
      mockedProfileService.updateDriverProfile.mockResolvedValue(updatedProfile as any);

      await profileController.updateDriverProfile(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockedProfileService.updateDriverProfile).toHaveBeenCalledWith("user-id", expect.any(Object));
      expect(mockResponse.json).toHaveBeenCalledWith(updatedProfile);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  // updateDriverBasicProfile 함수 테스트
  describe("updateDriverBasicProfile", () => {
    const updateData = { name: "Driver New Name" };
    const updatedProfile = { authUser: { id: "user-id", name: "Driver New Name" } };

    it("기사 기본 정보 수정 성공 시 수정된 데이터를 반환해야 합니다.", async () => {
      mockRequest.user = { id: "user-id", userType: UserType.DRIVER };
      mockRequest.body = updateData;
      mockedProfileService.updateDriverBasicProfile.mockResolvedValue(updatedProfile as any);

      await profileController.updateDriverBasicProfile(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockedProfileService.updateDriverBasicProfile).toHaveBeenCalledWith("user-id", expect.any(Object));
      expect(mockResponse.json).toHaveBeenCalledWith(updatedProfile);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
