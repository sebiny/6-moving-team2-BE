import { Request, Response, NextFunction } from "express";
import authController from "./auth.controller";
import authService from "../services/auth.service";
import authRepository from "../repositories/auth.repository";
import passport from "passport";
import { CustomError } from "../utils/customError";
import { UserType } from "@prisma/client";

// 의존성 모의 처리
jest.mock("../services/auth.service");
jest.mock("../repositories/auth.repository");
jest.mock("passport");

// 모의 처리된 모듈에 대한 타입 단언
const mockedAuthService = authService as jest.Mocked<typeof authService>;
const mockedAuthRepository = authRepository as jest.Mocked<typeof authRepository>;
const mockedPassport = passport as jest.Mocked<typeof passport>;

describe("AuthController", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    // 각 테스트 전에 모의 객체 초기화
    jest.clearAllMocks();

    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
      redirect: jest.fn()
    };
    mockNext = jest.fn();
  });

  describe("signUp", () => {
    it("회원가입 성공 시 201 상태 코드와 결과를 반환해야 합니다.", async () => {
      mockRequest.body = {
        userType: UserType.CUSTOMER,
        name: "Test User",
        email: "test@example.com",
        phone: "01012345678",
        password: "password123",
        passwordConfirmation: "password123"
      };
      const signUpResult = { message: "회원가입 성공" };
      mockedAuthService.signUpUser.mockResolvedValue(signUpResult);

      await authController.signUp(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockedAuthService.signUpUser).toHaveBeenCalledWith(mockRequest.body);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(signUpResult);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("필수 필드가 누락된 경우 CustomError와 함께 next를 호출해야 합니다.", async () => {
      mockRequest.body = {}; // 필수 필드 누락

      await authController.signUp(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(new CustomError(422, "필수 필드를 모두 입력해주세요."));
    });
  });

  describe("logIn", () => {
    it("로그인 성공 시 리프레시 토큰을 쿠키에 설정하고, 액세스 토큰과 유저 정보를 반환해야 합니다.", async () => {
      mockRequest.body = {
        email: "test@example.com",
        password: "password123"
      };
      const loginResult = {
        accessToken: "fake-access-token",
        refreshToken: "fake-refresh-token",
        user: { id: "user-id", userType: UserType.CUSTOMER, customerId: "cust-id", driverId: null }
      };
      mockedAuthService.signInUser.mockResolvedValue(loginResult);

      await authController.logIn(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockedAuthService.signInUser).toHaveBeenCalledWith("test@example.com", "password123");
      expect(mockResponse.cookie).toHaveBeenCalledWith("refreshToken", loginResult.refreshToken, {
        httpOnly: true,
        path: "/",
        sameSite: "none",
        secure: true
      });
      expect(mockResponse.json).toHaveBeenCalledWith({ accessToken: loginResult.accessToken, user: loginResult.user });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("이메일이나 비밀번호가 누락된 경우 CustomError와 함께 next를 호출해야 합니다.", async () => {
      mockRequest.body = { email: "test@example.com" }; // 비밀번호 누락

      await authController.logIn(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(new CustomError(422, "이메일과 비밀번호를 입력해주세요."));
    });
  });

  describe("logOut", () => {
    it("리프레시 토큰 쿠키를 삭제하고 200 상태 코드를 반환해야 합니다.", async () => {
      await authController.logOut(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.clearCookie).toHaveBeenCalledWith("refreshToken", {
        httpOnly: true,
        path: "/",
        sameSite: "none",
        secure: true
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: "성공적으로 로그아웃되었습니다." });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("getMe", () => {
    it("인증된 사용자의 정보를 반환해야 합니다.", async () => {
      const userPayload = { id: "user-id", userType: UserType.CUSTOMER, customerId: "cust-id", driverId: null };
      mockRequest.user = userPayload;

      await authController.getMe(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith({ user: userPayload });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("인증되지 않은 경우 CustomError와 함께 next를 호출해야 합니다.", async () => {
      mockRequest.user = undefined;

      await authController.getMe(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(new CustomError(401, "인증 정보가 없습니다."));
    });
  });

  describe("getMeName", () => {
    it("인증된 사용자의 이름과 프로필 이미지를 반환해야 합니다.", async () => {
      const userPayload = { id: "user-id", userType: UserType.CUSTOMER, customerId: "cust-id", driverId: null };
      mockRequest.user = userPayload;
      const repoResult = { name: "Test User", profileImage: "image.jpg" };
      mockedAuthRepository.findNameById.mockResolvedValue(repoResult);

      await authController.getMeName(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockedAuthRepository.findNameById).toHaveBeenCalledWith("user-id");
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(repoResult);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("리포지토리에서 사용자를 찾지 못한 경우 CustomError와 함께 next를 호출해야 합니다.", async () => {
      const userPayload = { id: "user-id", userType: UserType.CUSTOMER, customerId: "cust-id", driverId: null };
      mockRequest.user = userPayload;
      mockedAuthRepository.findNameById.mockResolvedValue(null);

      await authController.getMeName(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(new CustomError(404, "사용자를 찾을 수 없습니다."));
    });
  });

  describe("getUserById", () => {
    it("비밀번호를 제외한 상세 유저 정보를 반환해야 합니다.", async () => {
      const userPayload = { id: "user-id", userType: UserType.CUSTOMER, customerId: "cust-id", driverId: null };
      mockRequest.user = userPayload;
      const serviceResult = {
        id: "user-id",
        email: "test@example.com",
        password: "hashedpassword",
        name: "Test User"
      };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...publicUser } = serviceResult;
      mockedAuthService.getUserById.mockResolvedValue(serviceResult as any);

      await authController.getUserById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockedAuthService.getUserById).toHaveBeenCalledWith("user-id");
      expect(mockResponse.json).toHaveBeenCalledWith(publicUser);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("refreshToken", () => {
    it("새로운 액세스 토큰을 반환해야 합니다.", async () => {
      const userPayload = { id: "user-id", userType: UserType.CUSTOMER, customerId: "cust-id", driverId: null };
      mockRequest.user = userPayload;
      const newAccessToken = "new-fake-access-token";
      mockedAuthService.generateNewAccessToken.mockReturnValue(newAccessToken);

      await authController.refreshToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockedAuthService.generateNewAccessToken).toHaveBeenCalledWith(userPayload);
      expect(mockResponse.json).toHaveBeenCalledWith({ accessToken: newAccessToken });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  // 소셜 로그인 테스트는 passport 모의 처리의 복잡성으로 인해 생략되었습니다.
  // 필요하다면 passport-mock 등의 라이브러리를 사용하여 추가할 수 있습니다.
});
