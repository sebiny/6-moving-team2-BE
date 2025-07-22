import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { AuthUser, Customer, Driver, AuthProvider } from "@prisma/client";
import authRepository, { AuthUserWithProfile } from "../repositories/auth.repository";
import { CustomError } from "../utils/customError";
import { UserType } from "../types/userType";
import { notificationService } from "./notification.service";

const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in .env");
}

const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || "60m";
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

type SignUpUserData = {
  userType: UserType;
  email: string;
  phone: string;
  password: string;
  passwordConfirmation: string;
  name: string;
};

// 토큰 생성 헬퍼 함수
function generateTokens(payload: TokenUserPayload): { accessToken: string; refreshToken: string } {
  const cleanPayload = { ...payload };
  delete (cleanPayload as any).exp;

  const accessToken = jwt.sign(cleanPayload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN
  } as SignOptions);

  const refreshToken = jwt.sign(cleanPayload, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN
  } as SignOptions);

  return { accessToken, refreshToken };
}

type UserResponse = Pick<AuthUser, "id" | "email" | "userType" | "phone" | "name">;

export type TokenUserPayload = {
  id: string;
  userType: UserType;
  customerId?: string;
  driverId?: string;
};

type SignInResponse = {
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
};

// 회원가입
async function signUpUser(data: SignUpUserData): Promise<Omit<AuthUser, "password">> {
  const { userType, email, phone, password, passwordConfirmation, name } = data;

  // 이메일 형식 검사
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    throw new CustomError(422, "유효하지 않은 이메일 형식입니다. 영문, 숫자, 일부 특수문자만 사용 가능합니다.");
  }

  // 전화번호 형식 검사 (대한민국)
  const phoneRegex = /^010?\d{4}?\d{4}$/;
  if (!phoneRegex.test(phone)) {
    throw new CustomError(422, "유효하지 않은 전화번호 형식입니다. 숫자만 입력해 주세요.");
  }

  // 이름 유효성 검사 (2~5자의 한글)
  const nameRegex = /^[가-힣]{2,5}$/;
  if (!nameRegex.test(name)) {
    throw new CustomError(422, "이름은 2~5자의 한글만 사용 가능합니다.");
  }

  // 비밀번호 복잡성 검사: 최소 8자, 영문, 숫자, 특수문자 포함
  const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
  if (!passwordRegex.test(password)) {
    throw new CustomError(422, "비밀번호는 최소 8자 이상이며 영문, 숫자, 특수문자를 포함해야 합니다.");
  }

  if (password !== passwordConfirmation) {
    throw new CustomError(422, "비밀번호가 일치하지 않습니다.");
  }

  const existingUser = await authRepository.findByEmail(email);
  if (existingUser) {
    throw new CustomError(409, "이미 사용중인 이메일입니다.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await authRepository.createAuthUser({
    email,
    phone,
    password: hashedPassword,
    userType,
    name,
    provider: AuthProvider.LOCAL,
    providerId: null
  });

  const { password: _, ...userWithoutPassword } = newUser;

  // 알림 전송
  // 알림 전송 로직을 try...catch로 감쌈
  // 요청을 보내면 서버에서 성공한다면, noti 하면 된다. 트랜잭션 하지 말고. .then으로 관리할 것
  // 실무 방식은..?
  // 중간과정에서 가공이 필요하다면 별도의 테이블이 합리적
  // 액션테이블 : 분석, 감사 목적으로 만듦, 기록으로 남김
  // 알림테이블에서 클라이언트로 보냄,
  try {
    // 알림 전송 (비동기 처리를 위해 await을 붙이거나, 백그라운드 실행)
    notificationService.createAndSendSignUpNotification(newUser);
  } catch (error) {
    // 알림 전송에 실패하더라도 회원가입은 성공해야 함
    // 에러를 로깅하여 추후 원인을 파악하고 수정
    console.error("알림 전송 실패:", error);
  }

  return userWithoutPassword;
}

// 로그인
async function signInUser(email: string, passwordInput: string): Promise<SignInResponse> {
  const authUser = await authRepository.findByEmail(email);

  if (!authUser || !authUser.password) {
    throw new CustomError(401, "이메일 또는 비밀번호가 일치하지 않습니다.");
  }

  const isPasswordValid = await bcrypt.compare(passwordInput, authUser.password);
  if (!isPasswordValid) {
    throw new CustomError(401, "이메일 또는 비밀번호가 일치하지 않습니다.");
  }

  const payload: TokenUserPayload = {
    id: authUser.id!,
    userType: authUser.userType,
    customerId: authUser.customer?.id,
    driverId: authUser.driver?.id
  };

  const { accessToken, refreshToken } = generateTokens(payload);

  const user: UserResponse = {
    id: authUser!.id,
    email: authUser.email,
    userType: authUser.userType,
    phone: authUser.phone,
    name: authUser.name
  };

  return { accessToken, refreshToken, user };
}

// 액세스 토큰 재발급
function generateNewAccessToken(user: TokenUserPayload): string {
  const { accessToken } = generateTokens(user);
  return accessToken;
}

// 소셜 로그인 후 토큰 발급
async function handleSocialLogin(user: TokenUserPayload): Promise<SignInResponse> {
  const authUser = await authRepository.findById(user.id);

  if (!authUser) {
    throw new CustomError(401, "사용자 정보를 찾을 수 없습니다.");
  }

  const payload: TokenUserPayload = {
    id: authUser.id,
    userType: authUser.userType,
    customerId: authUser.customer?.id,
    driverId: authUser.driver?.id
  };

  const { accessToken, refreshToken } = generateTokens(payload);
  const userResponse: UserResponse = {
    id: authUser.id,
    email: authUser.email,
    userType: authUser.userType,
    phone: authUser.phone,
    name: authUser.name
  };

  return { accessToken, refreshToken, user: userResponse };
}

// 유저 ID로 조회
async function getUserById(id: string): Promise<AuthUserWithProfile | null> {
  return authRepository.findById(id);
}

// 소셜 로그인 유저 조회 또는 생성
async function findOrCreateOAuthUser(profile: {
  provider: AuthProvider;
  providerId: string;
  email: string | null;
  displayName: string;
  profileImageUrl: string | null;
}): Promise<TokenUserPayload> {
  const { provider, providerId, email, displayName, profileImageUrl } = profile;

  if (provider === AuthProvider.LOCAL) {
    throw new CustomError(400, "LOCAL 제공자는 소셜 로그인으로 사용할 수 없습니다.");
  }

  let authUser = await authRepository.findByProviderId(provider, providerId);

  if (!authUser) {
    if (!email) {
      throw new CustomError(400, `소셜 프로필에 이메일 정보가 없습니다. (${provider})`);
    }

    const existingUser = await authRepository.findByEmail(email);
    if (existingUser) {
      throw new CustomError(409, `이미 다른 계정으로 가입된 이메일입니다. (${existingUser.provider})`);
    }

    authUser = await authRepository.createAuthUser({
      email,
      phone: null,
      password: null,
      userType: UserType.CUSTOMER,
      provider,
      providerId,
      name: displayName
    });
  }

  return {
    id: authUser!.id,
    userType: authUser!.userType
  };
}

export default {
  signUpUser,
  signInUser,
  generateTokens,
  generateNewAccessToken,
  handleSocialLogin,
  getUserById,
  findOrCreateOAuthUser
};
