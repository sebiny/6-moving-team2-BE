import prisma from '../config/prisma';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { AuthUser, UserType } from '@prisma/client';
import authRepository, { AuthUserWithProfile } from '../repositories/AuthRepository';
import { CustomError } from '../utils/CustomError';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET 설정하세요.');
}

const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '60m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

// 고객 / 기사 회원가입 타입 분리
type BaseSignUpData = {
  email: string;
  phone: string;
  password: string;
  passwordConfirmation: string;
};

type CustomerSignUpData = BaseSignUpData & {
  userType: UserType.CUSTOMER;
  name: string;
};

type DriverSignUpData = BaseSignUpData & {
  userType: UserType.DRIVER;
  nickname: string;
};

type SignUpUserData = CustomerSignUpData | DriverSignUpData;

/**
 * 사용자 타입(CUSTOMER, DRIVER)에 따라 회원가입을 처리합니다.
 */
async function signUpUser(data: SignUpUserData): Promise<Omit<AuthUser, 'password'>> {
  const { userType, email, phone, password, passwordConfirmation } = data;

  if (password !== passwordConfirmation) {
    throw new CustomError(422, '비밀번호가 일치하지 않습니다.');
  }

  const existingUserByEmail = await prisma.authUser.findUnique({ where: { email } });
  if (existingUserByEmail) {
    throw new CustomError(409, '이미 사용중인 이메일입니다.');
  }

  if (userType === UserType.DRIVER) {
    // 기사 닉네임 중복 검사
    const existingDriverByNickname = await prisma.driver.findUnique({ where: { nickname: data.nickname } });
    if (existingDriverByNickname) {
      throw new CustomError(409, '이미 사용중인 닉네임입니다.');
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.$transaction(async (tx) => {
    const newAuthUser = await tx.authUser.create({
      data: {
        email,
        password: hashedPassword,
        phone,
        userType
      }
    });

    if (userType === UserType.CUSTOMER) {
      await tx.customer.create({
        data: {
          authUserId: newAuthUser.id,
          name: data.name
        }
      });
    } else {
      await tx.driver.create({
        data: {
          authUserId: newAuthUser.id,
          nickname: data.nickname
        }
      });
    }

    return newAuthUser;
  });

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

// 로그인/소셜로그인 시 클라이언트에 반환될 사용자 정보 타입
type UserResponse = Pick<AuthUser, 'id' | 'email' | 'userType' | 'phone'> & {
  name?: string;
  nickname?: string;
};

type SignInResponse = {
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
};

/**
 * 이메일과 비밀번호로 사용자를 인증하고 토큰을 발급합니다.
 */
async function signInUser(email: AuthUser['email'], passwordInput: string): Promise<SignInResponse> {
  const authUser = await prisma.authUser.findUnique({
    where: { email },
    include: {
      customer: { select: { name: true } },
      driver: { select: { nickname: true } }
    }
  });

  if (!authUser || !authUser.password) {
    throw new CustomError(401, '이메일 또는 비밀번호가 일치하지 않습니다.');
  }

  const isPasswordValid = await bcrypt.compare(passwordInput, authUser.password);
  if (!isPasswordValid) {
    throw new CustomError(401, '이메일 또는 비밀번호가 일치하지 않습니다.');
  }

  const payload = {
    userId: authUser.id
  };

  const accessTokenOptions: SignOptions = {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN
  };
  const refreshTokenOptions: SignOptions = {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, accessTokenOptions);
  const refreshToken = jwt.sign(payload, JWT_SECRET, refreshTokenOptions);

  // 응답에 포함될 사용자 정보 객체 생성
  const userResponse: UserResponse = {
    id: authUser.id,
    email: authUser.email,
    userType: authUser.userType,
    phone: authUser.phone,
    name: authUser.customer?.name,
    nickname: authUser.driver?.nickname
  };

  return { accessToken, refreshToken, user: userResponse };
}

// req.user에 담길 사용자 정보 타입
export type TokenUserPayload = UserResponse;

/**
 * 새로운 Access Token을 발급합니다.
 */
function generateNewAccessToken(user: Pick<TokenUserPayload, 'id'>): string {
  if (!user || !user.id) {
    throw new CustomError(400, '새로운 액세스 토큰을 생성하기 위한 사용자 정보가 유효하지 않습니다.');
  }

  const payload = { userId: user.id };

  const signOptions: SignOptions = {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN
  };

  return jwt.sign(payload, JWT_SECRET, signOptions);
}

/**
 * 소셜 로그인 처리 및 토큰 발급. signInUser와 응답 형식을 통일합니다.
 */
async function handleSocialLogin(user: TokenUserPayload): Promise<SignInResponse> {
  const payload = {
    userId: user.id
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN
  });
  const refreshToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN
  });

  return { accessToken, refreshToken, user };
}

/**
 * ID로 사용자를 조회합니다. JWT 전략에서 사용됩니다.
 * @param id 사용자 ID
 */
async function getUserById(id: number): Promise<AuthUserWithProfile | null> {
  return authRepository.findById(id);
}

export default {
  signUpUser,
  signInUser,
  generateNewAccessToken,
  handleSocialLogin,
  getUserById
};
