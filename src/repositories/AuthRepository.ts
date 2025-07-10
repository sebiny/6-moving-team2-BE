import prisma from '../config/prisma';
import type { AuthUser, Customer, Driver, Prisma } from '@prisma/client';
import { UserType } from '../types/UserType';
import { AuthProvider } from '@prisma/client';

export type AuthUserWithProfile = AuthUser & {
  customer?: Customer | null;
  driver?: Pick<Driver, 'nickname'> | null;
};

// 이메일로 AuthUser 조회 (프로필 포함)
export async function findByEmail(email: string): Promise<AuthUserWithProfile | null> {
  return prisma.authUser.findUnique({
    where: { email },
    include: {
      customer: true,
      driver: {
        select: { nickname: true }
      }
    }
  });
}

// ID로 AuthUser 조회 (프로필 포함)
export async function findById(id: string): Promise<AuthUserWithProfile | null> {
  return prisma.authUser.findUnique({
    where: { id },
    include: {
      customer: true,
      driver: {
        select: { nickname: true }
      }
    }
  });
}

// 소셜 로그인 providerId로 조회
export async function findByProviderId(
  provider: AuthProvider,
  providerId: string
): Promise<AuthUserWithProfile | null> {
  return prisma.authUser.findFirst({
    where: {
      provider,
      providerId
    },
    include: { customer: true, driver: true }
  });
}

// ID로 AuthUser 조회 (비밀번호 포함, 인증용)
export async function findAuthUserWithPassword(id: string): Promise<AuthUser | null> {
  return prisma.authUser.findUnique({
    where: { id }
  });
}

// 회원가입 시 AuthUser 생성 (프로필 없이)
export async function createAuthUser(data: Prisma.AuthUserCreateInput): Promise<AuthUser> {
  return prisma.authUser.create({
    data
  });
}

// authUser 정보를 업데이트하는 함수
async function updateAuthUser(
  id: string,
  data: {
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
  }
): Promise<void> {
  await prisma.authUser.update({
    where: { id },
    data
  });
}

export default {
  findByEmail,
  findById,
  findByProviderId,
  createAuthUser,
  updateAuthUser,
  findAuthUserWithPassword
};
