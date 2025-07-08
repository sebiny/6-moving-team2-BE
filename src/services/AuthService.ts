import prisma from '../config/prisma';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { AuthUser, AuthProvider } from '@prisma/client';
import authRepository, { AuthUserWithProfile } from '../repositories/AuthRepository';
import { CustomError } from '../utils/CustomError';
import { UserType } from '../types/UserType';

const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in .env');
}

const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '60m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

type BaseSignUpData = {
  email: string;
  phone: string;
  password: string;
  passwordConfirmation: string;
};

type CustomerSignUpData = BaseSignUpData & {
  userType: typeof UserType.CUSTOMER;
  name: string;
};

type DriverSignUpData = BaseSignUpData & {
  userType: typeof UserType.DRIVER;
  nickname: string;
};

type SignUpUserData = CustomerSignUpData | DriverSignUpData;

type UserResponse = Pick<AuthUser, 'id' | 'email' | 'userType' | 'phone'> & {
  name?: string;
  nickname?: string;
};

type SignInResponse = {
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
};

export type TokenUserPayload = UserResponse;

type NormalizedOAuthProfile = {
  provider: AuthProvider;
  providerId: string;
  email: string | null;
  displayName: string;
  profileImageUrl: string | null;
};

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
    const { nickname } = data as DriverSignUpData;
    const existingDriverByNickname = await prisma.driver.findUnique({ where: { nickname } });
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
      const { name } = data as CustomerSignUpData;
      await tx.customer.create({
        data: {
          authUserId: newAuthUser.id,
          name
        }
      });
    } else {
      const { nickname } = data as DriverSignUpData;
      await tx.driver.create({
        data: {
          authUserId: newAuthUser.id,
          nickname
        }
      });
    }

    return newAuthUser;
  });

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

async function signInUser(email: string, passwordInput: string): Promise<SignInResponse> {
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

  const payload = { userId: authUser.id };

  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN
  } as SignOptions);

  const refreshToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN
  } as SignOptions);

  const user: UserResponse = {
    id: authUser.id,
    email: authUser.email,
    userType: authUser.userType,
    phone: authUser.phone,
    name: authUser.customer?.name,
    nickname: authUser.driver?.nickname
  };

  return { accessToken, refreshToken, user };
}

function generateNewAccessToken(user: Pick<TokenUserPayload, 'id'>): string {
  const payload = { userId: user.id };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN
  } as SignOptions);
}

async function handleSocialLogin(user: TokenUserPayload): Promise<SignInResponse> {
  const payload = { userId: user.id };

  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN
  } as SignOptions);

  const refreshToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN
  } as SignOptions);

  return { accessToken, refreshToken, user };
}

async function getUserById(id: string): Promise<AuthUserWithProfile | null> {
  return authRepository.findById(id);
}

async function findOrCreateOAuthUser(profile: NormalizedOAuthProfile): Promise<TokenUserPayload> {
  let authUser = await prisma.authUser.findFirst({
    where: {
      provider: profile.provider,
      providerId: profile.providerId
    },
    include: {
      customer: true,
      driver: true
    }
  });

  if (!authUser) {
    authUser = await prisma.authUser.create({
      data: {
        email: profile.email || '',
        phone: '',
        password: '',
        userType: UserType.CUSTOMER,
        provider: profile.provider,
        providerId: profile.providerId,
        customer: {
          create: {
            name: profile.displayName
          }
        }
      },
      include: {
        customer: true,
        driver: true
      }
    });
  }

  if (!authUser) {
    throw new CustomError(500, 'OAuth 사용자 생성 실패');
  }

  return {
    id: authUser.id,
    email: authUser.email,
    userType: authUser.userType,
    phone: authUser.phone || '',
    name: authUser.customer?.name,
    nickname: authUser.driver?.nickname
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
