// src/repositories/AuthRepository.ts
import prisma from '../config/prisma';
import { AuthUser, Prisma, UserType, AuthProvider } from '@prisma/client';

// 서비스 레이어의 SignUpUserData와 유사하게, 타입 안정성을 높이기 위한 명확한 타입 정의
type CreateCustomerParams = Omit<Prisma.AuthUserCreateInput, 'userType' | 'customer' | 'driver'> & {
  userType: UserType.CUSTOMER;
  name: string;
};

type CreateDriverParams = Omit<Prisma.AuthUserCreateInput, 'userType' | 'customer' | 'driver'> & {
  userType: UserType.DRIVER;
  nickname: string;
};

export type CreateAuthUserParams = CreateCustomerParams | CreateDriverParams;

/**
 * AuthUser와 연결된 프로필(Customer/Driver)을 트랜잭션으로 함께 생성합니다.
 */
async function createAuthUserWithProfile(data: CreateAuthUserParams): Promise<AuthUser> {
  const { userType, ...rest } = data;

  return prisma.$transaction(async (tx) => {
    const authUser = await tx.authUser.create({
      data: {
        email: rest.email,
        password: rest.password,
        phone: rest.phone,
        userType
      }
    });

    if (userType === UserType.CUSTOMER) {
      await tx.customer.create({
        data: {
          authUserId: authUser.id,
          name: (data as CreateCustomerParams).name
        }
      });
    } else {
      await tx.driver.create({
        data: {
          authUserId: authUser.id,
          nickname: (data as CreateDriverParams).nickname
        }
      });
    }

    return authUser;
  });
}

// AuthService의 UserResponse와 유사한 응답 타입을 정의하여 일관성 유지
export type AuthUserWithProfile = AuthUser & {
  customer?: { name: string } | null;
  driver?: { nickname: string } | null;
};

async function findById(id: number) {
  return prisma.authUser.findUnique({
    where: { id },
    include: {
      customer: true,
      driver: true
    }
  });
}

async function findByIdWithPassword(id: number) {
  return prisma.authUser.findUnique({
    where: { id },
    include: {
      customer: true,
      driver: true
    }
  });
}

async function findByEmail(email: string) {
  return prisma.authUser.findUnique({
    where: { email },
    include: {
      customer: true,
      driver: true
    }
  });
}

async function findByNickname(nickname: string) {
  return prisma.driver.findUnique({
    where: { nickname },
    select: {
      id: true,
      nickname: true
    }
  });
}

async function updateAuthUser(id: number, data: Prisma.AuthUserUpdateInput) {
  return prisma.authUser.update({
    where: { id },
    data,
    include: {
      customer: true,
      driver: true
    }
  });
}

async function findByProviderId(provider: 'google' | 'kakao' | 'naver', providerId: string) {
  return prisma.authUser.findFirst({
    where: {
      [`${provider}Id`]: providerId
    } as any,
    include: {
      customer: true,
      driver: true
    }
  });
}

export default {
  createAuthUserWithProfile,
  findById,
  findByIdWithPassword,
  findByEmail,
  findByNickname,
  updateAuthUser,
  findByProviderId
};
