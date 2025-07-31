import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import authService, { TokenUserPayload } from "./auth.service";
import authRepository from "../repositories/auth.repository";
import notificationService from "../services/notification.service";
import { CustomError } from "../utils/customError";
import { AuthProvider, UserType } from "@prisma/client";

jest.mock("bcrypt");
jest.mock("jsonwebtoken");
jest.mock("../repositories/auth.repository");
jest.mock("../services/notification.service");

const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockedJwt = jwt as jest.Mocked<typeof jwt>;
const mockedAuthRepository = authRepository as jest.Mocked<typeof authRepository>;
const mockedNotificationService = notificationService as jest.Mocked<typeof notificationService>;

describe("AuthService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("signUpUser", () => {
    const validUserData = {
      userType: UserType.CUSTOMER,
      name: "테스트",
      email: "test@example.com",
      phone: "01012345678",
      password: "password123!",
      passwordConfirmation: "password123!"
    };

    test("회원가입 성공 시 비밀번호를 제외한 유저 정보를 반환해야 합니다.", async () => {
      const hashedPassword = "hashedPassword";
      const newUser = { id: "user-id", ...validUserData, password: hashedPassword, provider: AuthProvider.LOCAL };

      mockedAuthRepository.findByEmail.mockResolvedValue(null);
      (mockedBcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockedAuthRepository.createAuthUser.mockResolvedValue(newUser as any);

      const result = await authService.signUpUser(validUserData);

      expect(mockedAuthRepository.findByEmail).toHaveBeenCalledWith(validUserData.email);
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(validUserData.password, 10);
      expect(mockedAuthRepository.createAuthUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: validUserData.email,
          password: hashedPassword
        })
      );
      expect(mockedNotificationService.createAndSendSignUpNotification).toHaveBeenCalledWith(newUser);
      expect(result).not.toHaveProperty("password");
      expect(result.email).toBe(validUserData.email);
    });

    test("이미 사용 중인 이메일인 경우 CustomError를 던져야 합니다.", async () => {
      mockedAuthRepository.findByEmail.mockResolvedValue({ id: "existing-user-id" } as any);

      await expect(authService.signUpUser(validUserData)).rejects.toThrow(
        new CustomError(409, "이미 사용중인 이메일입니다.")
      );
    });

    test("비밀번호와 비밀번호 확인이 일치하지 않는 경우 CustomError를 던져야 합니다.", async () => {
      const invalidUserData = { ...validUserData, passwordConfirmation: "wrongPassword" };
      await expect(authService.signUpUser(invalidUserData)).rejects.toThrow(
        new CustomError(422, "비밀번호가 일치하지 않습니다.")
      );
    });

    test("유효하지 않은 이메일 형식인 경우 CustomError를 던져야 합니다.", async () => {
      const invalidUserData = { ...validUserData, email: "invalid-email" };
      await expect(authService.signUpUser(invalidUserData)).rejects.toThrow(
        new CustomError(422, "유효하지 않은 이메일 형식입니다. 영문, 숫자, 일부 특수문자만 사용 가능합니다.")
      );
    });
  });

  describe("signInUser", () => {
    const email = "test@example.com";
    const password = "password123!";
    const userType = UserType.CUSTOMER;
    const authUser = {
      id: "user-id",
      email,
      password: "hashedPassword",
      userType: UserType.CUSTOMER,
      phone: "01012345678",
      name: "테스트",
      customer: { id: "customer-id" }
    };

    test("로그인 성공 시 토큰과 사용자 정보를 반환해야 합니다.", async () => {
      const tokens = { accessToken: "access-token", refreshToken: "refresh-token" };
      mockedAuthRepository.findByEmail.mockResolvedValue(authUser as any);
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);
      (mockedJwt.sign as jest.Mock).mockReturnValueOnce(tokens.accessToken).mockReturnValueOnce(tokens.refreshToken);

      const result = await authService.signInUser(email, password, userType);

      expect(mockedAuthRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(password, authUser.password);
      expect(result.accessToken).toBe(tokens.accessToken);
      expect(result.refreshToken).toBe(tokens.refreshToken);
      expect(result.user.id).toBe(authUser.id);
    });

    test("사용자를 찾을 수 없는 경우 CustomError를 던져야 합니다.", async () => {
      mockedAuthRepository.findByEmail.mockResolvedValue(null);

      await expect(authService.signInUser(email, password, userType)).rejects.toThrow(
        new CustomError(401, "이메일 또는 비밀번호가 일치하지 않습니다.")
      );
    });

    test("비밀번호가 일치하지 않는 경우 CustomError를 던져야 합니다.", async () => {
      mockedAuthRepository.findByEmail.mockResolvedValue(authUser as any);
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.signInUser(email, password, userType)).rejects.toThrow(
        new CustomError(401, "이메일 또는 비밀번호가 일치하지 않습니다.")
      );
    });

    test("비밀번호가 일치하지만 고객이 기사로 로그인 시도 시 CustomError를 던져야 합니다.", async () => {
      // authUser는 CUSTOMER 타입
      mockedAuthRepository.findByEmail.mockResolvedValue(authUser as any);
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(authService.signInUser(email, password, UserType.DRIVER)).rejects.toThrow(
        new CustomError(403, "고객 페이지에서 로그인해주세요.")
      );
    });

    test("비밀번호가 일치하지만 기사가 고객으로 로그인 시도 시 CustomError를 던져야 합니다.", async () => {
      const driverAuthUser = {
        ...authUser,
        userType: UserType.DRIVER,
        customer: null,
        driver: { id: "driver-id" }
      };
      mockedAuthRepository.findByEmail.mockResolvedValue(driverAuthUser as any);
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(authService.signInUser(email, password, UserType.CUSTOMER)).rejects.toThrow(
        new CustomError(403, "기사 페이지에서 로그인해주세요.")
      );
    });

    test("소셜 로그인 유저처럼 비밀번호가 없는 경우 CustomError를 던져야 합니다.", async () => {
      const userWithoutPassword = { ...authUser, password: null };
      mockedAuthRepository.findByEmail.mockResolvedValue(userWithoutPassword as any);

      await expect(authService.signInUser(email, password, userType)).rejects.toThrow(
        new CustomError(401, "이메일 또는 비밀번호가 일치하지 않습니다.")
      );
    });
  });

  describe("generateTokens", () => {
    test("주어진 payload로 액세스 토큰과 리프레시 토큰을 생성해야 합니다.", () => {
      const payload: TokenUserPayload = { id: "user-id", userType: UserType.CUSTOMER };
      const tokens = { accessToken: "access-token", refreshToken: "refresh-token" };

      (mockedJwt.sign as jest.Mock).mockReturnValueOnce(tokens.accessToken).mockReturnValueOnce(tokens.refreshToken);

      const result = authService.generateTokens(payload);

      expect(mockedJwt.sign).toHaveBeenCalledTimes(2);
      expect(mockedJwt.sign).toHaveBeenCalledWith(payload, expect.any(String), { expiresIn: expect.any(String) });
      expect(result).toEqual(tokens);
    });
  });

  describe("generateNewAccessToken", () => {
    test("주어진 payload로 새로운 액세스 토큰을 생성해야 합니다.", async () => {
      const payload: TokenUserPayload = { id: "user-id", userType: UserType.CUSTOMER };
      const mockUser = {
        id: "user-id",
        userType: UserType.CUSTOMER,
        email: "test@test.com",
        name: "test",
        phone: "01012345678",
        customer: { id: "customer-id" }
      };

      const newAccessToken = "new-access-token";

      mockedAuthRepository.findById.mockResolvedValue(mockUser as any);

      (mockedJwt.sign as jest.Mock).mockReturnValueOnce(newAccessToken).mockReturnValueOnce("some-refresh-token");

      const result = await authService.generateNewAccessToken(payload);

      expect(mockedAuthRepository.findById).toHaveBeenCalledWith(payload.id);
      expect(result).toBe(newAccessToken);
      expect(mockedJwt.sign).toHaveBeenCalledTimes(2);
    });

    test("사용자를 찾을 수 없는 경우 CustomError를 던져야 합니다.", async () => {
      const payload: TokenUserPayload = { id: "non-existent-user", userType: UserType.CUSTOMER };

      mockedAuthRepository.findById.mockResolvedValue(null);

      await expect(authService.generateNewAccessToken(payload)).rejects.toThrow(
        new CustomError(401, "사용자를 찾을 수 없습니다.")
      );
    });
  });

  describe("handleSocialLogin", () => {
    test("소셜 로그인 성공 시 토큰과 사용자 정보를 반환해야 합니다.", async () => {
      const userPayload: TokenUserPayload = { id: "user-id", userType: UserType.DRIVER, driverId: "driver-id" };
      const authUser = {
        id: "user-id",
        email: "social@example.com",
        userType: UserType.DRIVER,
        phone: null,
        name: "소셜유저",
        driver: { id: "driver-id" }
      };
      const tokens = { accessToken: "social-access-token", refreshToken: "social-refresh-token" };

      mockedAuthRepository.findById.mockResolvedValue(authUser as any);
      (mockedJwt.sign as jest.Mock).mockReturnValueOnce(tokens.accessToken).mockReturnValueOnce(tokens.refreshToken);

      const result = await authService.handleSocialLogin(userPayload);

      expect(mockedAuthRepository.findById).toHaveBeenCalledWith(userPayload.id);
      expect(result.accessToken).toBe(tokens.accessToken);
      expect(result.user.name).toBe("소셜유저");
    });

    test("사용자를 찾을 수 없는 경우 CustomError를 던져야 합니다.", async () => {
      const userPayload: TokenUserPayload = { id: "non-existent-user", userType: UserType.CUSTOMER };
      mockedAuthRepository.findById.mockResolvedValue(null);

      await expect(authService.handleSocialLogin(userPayload)).rejects.toThrow(
        new CustomError(401, "사용자 정보를 찾을 수 없습니다.")
      );
    });
  });

  describe("findOrCreateOAuthUser", () => {
    const socialProfile = {
      provider: AuthProvider.KAKAO,
      providerId: "kakao-123",
      email: "kakao@example.com",
      displayName: "카카오유저",
      profileImageUrl: null
    };

    test("기존 소셜 유저가 존재하면 해당 유저 정보를 반환해야 합니다.", async () => {
      const existingUser = { id: "existing-user-id", userType: UserType.CUSTOMER };
      mockedAuthRepository.findByProviderId.mockResolvedValue(existingUser as any);

      const result = await authService.findOrCreateOAuthUser(socialProfile, UserType.CUSTOMER);

      expect(mockedAuthRepository.findByProviderId).toHaveBeenCalledWith(
        socialProfile.provider,
        socialProfile.providerId
      );
      expect(mockedAuthRepository.createAuthUser).not.toHaveBeenCalled();
      expect(result.id).toBe(existingUser.id);
    });

    test("새로운 소셜 유저인 경우 유저를 생성하고 정보를 반환해야 합니다.", async () => {
      const newUser = { id: "new-user-id", userType: UserType.CUSTOMER, ...socialProfile };
      mockedAuthRepository.findByProviderId.mockResolvedValue(null);
      mockedAuthRepository.findByEmail.mockResolvedValue(null);
      mockedAuthRepository.createAuthUser.mockResolvedValue(newUser as any);

      const result = await authService.findOrCreateOAuthUser(socialProfile, UserType.CUSTOMER);

      expect(mockedAuthRepository.createAuthUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: socialProfile.email,
          provider: socialProfile.provider,
          providerId: socialProfile.providerId
        })
      );
      expect(result.id).toBe(newUser.id);
    });

    test("새로운 소셜 유저이지만 이메일이 이미 다른 계정으로 가입된 경우 CustomError를 던져야 합니다.", async () => {
      const existingLocalUser = { id: "local-user-id", provider: AuthProvider.LOCAL };
      mockedAuthRepository.findByProviderId.mockResolvedValue(null);
      mockedAuthRepository.findByEmail.mockResolvedValue(existingLocalUser as any);

      await expect(authService.findOrCreateOAuthUser(socialProfile, UserType.CUSTOMER)).rejects.toThrow(
        new CustomError(409, `이미 다른 계정으로 가입된 이메일입니다. (${AuthProvider.LOCAL})`)
      );
    });

    test("소셜 프로필에 이메일이 없는 경우 CustomError를 던져야 합니다.", async () => {
      const profileWithoutEmail = { ...socialProfile, email: null };
      mockedAuthRepository.findByProviderId.mockResolvedValue(null);

      await expect(authService.findOrCreateOAuthUser(profileWithoutEmail, UserType.CUSTOMER)).rejects.toThrow(
        new CustomError(400, `소셜 프로필에 이메일 정보가 없습니다. (${socialProfile.provider})`)
      );
    });
  });
});
