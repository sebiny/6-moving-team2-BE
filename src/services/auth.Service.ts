import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { AuthUser, AuthProvider } from "@prisma/client";
import authRepository, { AuthUserWithProfile } from "../repositories/auth.Repository";
import { CustomError } from "../utils/custom.Error";
import { UserType } from "../types/userType";

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

type UserResponse = Pick<AuthUser, "id" | "email" | "userType" | "phone" | "name">;

export type TokenUserPayload = {
  id: string;
  userType: UserType;
};

type SignInResponse = {
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
};

// 회원가입
async function signUpUser(data: SignUpUserData): Promise<Omit<AuthUser, "password">> {
  const { userType, email, phone, password, passwordConfirmation, name } = data;

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
    userType: authUser.userType
  };

  const accessToken = jwt.sign(
    { userId: payload.id, userType: payload.userType }, // userType 추가
    JWT_SECRET,
    {
      expiresIn: ACCESS_TOKEN_EXPIRES_IN
    } as SignOptions
  );

  const refreshToken = jwt.sign(
    { userId: payload.id, userType: payload.userType }, // userType 추가
    JWT_SECRET,
    {
      expiresIn: REFRESH_TOKEN_EXPIRES_IN
    } as SignOptions
  );

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
  return jwt.sign({ userId: user.id, userType: user.userType }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN
  } as SignOptions);
}

// 소셜 로그인 후 토큰 발급
async function handleSocialLogin(user: TokenUserPayload): Promise<SignInResponse> {
  const authUser = await authRepository.findById(user.id);

  if (!authUser) {
    throw new CustomError(401, "사용자 정보를 찾을 수 없습니다.");
  }

  const accessToken = jwt.sign({ userId: user.id, userType: user.userType }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN
  } as SignOptions);

  const refreshToken = jwt.sign({ userId: user.id, userType: user.userType }, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN
  } as SignOptions);

  const userResponse: UserResponse = {
    id: authUser!.id,
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
  generateNewAccessToken,
  handleSocialLogin,
  getUserById,
  findOrCreateOAuthUser
};
