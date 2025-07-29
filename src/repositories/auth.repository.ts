import prisma from "../config/prisma";
import type { AuthUser, Customer, Driver, Prisma } from "@prisma/client";
import { UserType } from "../types/userType";
import { AuthProvider } from "@prisma/client";

export type AuthUserWithProfile = AuthUser & {
  customer?: Customer | null;
  driver?: Pick<Driver, "id" | "nickname"> | null;
};

type AuthInfo = {
  id: string;
  name: string;
};

// 이메일로 AuthUser 조회 (프로필 포함)
async function findByEmail(email: string): Promise<AuthUserWithProfile | null> {
  return prisma.authUser.findUnique({
    where: { email },
    include: {
      customer: true,
      driver: { select: { id: true, nickname: true } }
    }
  });
}

// ID로 AuthUser 조회 (프로필 포함)
async function findById(id: string): Promise<AuthUserWithProfile | null> {
  return prisma.authUser.findUnique({
    where: { id },
    include: {
      customer: true,
      driver: {
        include: {
          serviceAreas: {
            select: {
              region: true
            }
          }
        }
      }
    }
  });
}

// ID로 AuthUser의 이름만 조회
async function findNameById(id: string): Promise<{ name: string; profileImage: string | null } | null> {
  const user = await prisma.authUser.findUnique({
    where: { id },
    select: {
      name: true,
      customer: {
        select: {
          profileImage: true
        }
      },
      driver: {
        select: {
          profileImage: true
        }
      }
    }
  });
  if (!user) return null;

  const profileImage = user.customer?.profileImage || user.driver?.profileImage || null;
  return { name: user.name, profileImage };
}

// 소셜 로그인 providerId로 조회
async function findByProviderId(provider: AuthProvider, providerId: string): Promise<AuthUserWithProfile | null> {
  return prisma.authUser.findFirst({
    where: {
      provider,
      providerId
    },
    include: { customer: true, driver: true }
  });
}

// ID로 AuthUser 조회 (비밀번호 포함, 인증용)
async function findAuthUserWithPassword(id: string): Promise<AuthUser | null> {
  return prisma.authUser.findUnique({
    where: { id }
  });
}

// 회원가입 시 AuthUser 생성 (프로필 없이)
async function createAuthUser(data: Prisma.AuthUserCreateInput): Promise<AuthUser> {
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

async function findAuthUserProfileById(id: string) {
  const users = await prisma.authUser.findMany({
    where: {
      OR: [{ customer: { id: id } }, { driver: { id: id } }]
    },
    // ★★★ 핵심 변경 사항: select에 'name: true'를 추가합니다. ★★★
    select: {
      id: true,
      name: true // AuthUser 테이블의 name 필드를 함께 가져옵니다.
    },
    take: 1
  });

  if (users.length > 0) {
    // 이제 users[0]은 { id: "...", name: "..." } 형태의 객체입니다.
    return users[0];
  } else {
    return null;
  }
}

export default {
  findByEmail,
  findById,
  findByProviderId,
  createAuthUser,
  updateAuthUser,
  findAuthUserWithPassword,
  findAuthUserProfileById,
  findNameById
};
