import prisma from '../config/prisma';
import type { AuthUser, Prisma } from '@prisma/client';
import { UserType } from '../types/UserType';

type CreateCustomerParams = Omit<Prisma.AuthUserCreateInput, 'userType' | 'customer' | 'driver'> & {
  userType: typeof UserType.CUSTOMER;
  name: string;
};

type CreateDriverParams = Omit<Prisma.AuthUserCreateInput, 'userType' | 'customer' | 'driver'> & {
  userType: typeof UserType.DRIVER;
  nickname: string;
};

export type CreateAuthUserParams = CreateCustomerParams | CreateDriverParams;

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

export type AuthUserWithProfile = AuthUser & {
  customer?: { name: string } | null;
  driver?: { nickname: string } | null;
};

async function findById(id: string) {
  return prisma.authUser.findUnique({
    where: { id },
    include: {
      customer: true,
      driver: true
    }
  });
}

async function findByIdWithPassword(id: string) {
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

async function updateAuthUser(id: string, data: Prisma.AuthUserUpdateInput) {
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
