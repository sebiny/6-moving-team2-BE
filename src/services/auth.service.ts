import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { AuthUser, Customer, Driver, AuthProvider, UserType } from "@prisma/client";
import authRepository, { AuthUserWithProfile } from "../repositories/auth.repository";
import { CustomError } from "../utils/customError";
import notificationService from "./notification.service";

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

  // // 이름 유효성 검사 (2~5자의 한글)
  // const nameRegex = /^[가-힣]{2,5}$/;
  // if (!nameRegex.test(name)) {
  //   throw new CustomError(422, "이름은 2~5자의 한글만 사용 가능합니다.");
  // }

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

  // 알림 전송 로직, 전송에 실패하더라도 회원가입은 성공해야 함
  try {
    notificationService.createAndSendSignUpNotification(newUser);
  } catch (error) {
    console.error("알림 전송 실패:", error);
  }

  return userWithoutPassword;
}

// 로그인
async function signInUser(email: string, passwordInput: string, userType: UserType): Promise<SignInResponse> {
  const authUser = await authRepository.findByEmail(email);

  // 1. 유저 존재 여부 및 비밀번호 설정 여부 확인
  if (!authUser || !authUser.password) {
    throw new CustomError(401, "이메일 또는 비밀번호가 일치하지 않습니다.");
  }

  // 2. 비밀번호 일치 여부 확인
  const isPasswordValid = await bcrypt.compare(passwordInput, authUser.password);
  if (!isPasswordValid) {
    throw new CustomError(401, "이메일 또는 비밀번호가 일치하지 않습니다.");
  }

  // 3. 사용자 유형 일치 여부 확인
  if (authUser.userType !== userType) {
    if (authUser.userType === UserType.CUSTOMER) {
      throw new CustomError(403, "고객 페이지에서 로그인해주세요.");
    } else {
      // authUser.userType === UserType.DRIVER
      throw new CustomError(403, "기사 페이지에서 로그인해주세요.");
    }
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
async function generateNewAccessToken(user: TokenUserPayload): Promise<string> {
  // 안전하게 DB에서 사용자 정보 다시 조회
  const fullUser = await getUserById(user.id);

  if (!fullUser) {
    throw new CustomError(401, "사용자를 찾을 수 없습니다.");
  }

  const payload: TokenUserPayload = {
    id: fullUser.id,
    userType: fullUser.userType,
    customerId: fullUser.customer?.id,
    driverId: fullUser.driver?.id
  };

  const { accessToken } = generateTokens(payload);
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
async function findOrCreateOAuthUser(
  profile: {
    provider: AuthProvider;
    providerId: string;
    email: string | null;
    displayName: string;
    profileImageUrl: string | null;
  },
  userType: UserType
): Promise<TokenUserPayload> {
  const { provider, providerId, email, displayName } = profile;

  if (provider === AuthProvider.LOCAL) {
    throw new CustomError(400, "LOCAL 제공자는 소셜 로그인으로 사용할 수 없습니다.");
  }

  let authUser = await authRepository.findByProviderId(provider, String(providerId));

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
      userType,
      provider,
      providerId: String(providerId),
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
