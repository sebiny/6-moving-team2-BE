import { jest } from "@jest/globals";
import type { DeepMockProxy } from "jest-mock-extended";
import { mockDeep, mockReset } from "jest-mock-extended";
import prisma from "../config/prisma";
import authRepository from "./auth.repository";
import { AuthProvider, UserType } from "@prisma/client";

jest.mock("../config/prisma", () => ({
  __esModule: true,
  default: mockDeep<typeof prisma>()
}));

const mockPrisma = prisma as unknown as DeepMockProxy<typeof prisma>;

describe("AuthRepository", () => {
  const authUserId = "auth-user-id-1";
  const email = "test@example.com";

  beforeEach(() => {
    mockReset(mockPrisma);
  });

  describe("findByEmail", () => {
    test("주어진 이메일로 AuthUser를 프로필과 함께 찾아야 합니다.", async () => {
      const expectedUser = { id: authUserId, email, customer: { id: "cust-1" }, driver: null };
      mockPrisma.authUser.findUnique.mockResolvedValue(expectedUser as any);

      const result = await authRepository.findByEmail(email);

      expect(mockPrisma.authUser.findUnique).toHaveBeenCalledWith({
        where: { email },
        include: {
          customer: true,
          driver: { select: { id: true, nickname: true } }
        }
      });
      expect(result).toEqual(expectedUser);
    });
  });

  describe("findById", () => {
    test("주어진 ID로 AuthUser를 프로필과 함께 찾아야 합니다.", async () => {
      const expectedUser = { id: authUserId, email, customer: { id: "cust-1" }, driver: null };
      mockPrisma.authUser.findUnique.mockResolvedValue(expectedUser as any);

      const result = await authRepository.findById(authUserId);

      expect(mockPrisma.authUser.findUnique).toHaveBeenCalledWith({
        where: { id: authUserId },
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
      expect(result).toEqual(expectedUser);
    });
  });

  describe("findNameById", () => {
    test("고객 프로필 이미지가 있을 때 이름과 이미지 URL을 반환해야 합니다.", async () => {
      const userWithCustomerImage = {
        name: "테스트고객",
        customer: { profileImage: "customer.jpg" },
        driver: null
      };
      const expectedResult = { name: "테스트고객", profileImage: "customer.jpg" };
      mockPrisma.authUser.findUnique.mockResolvedValue(userWithCustomerImage as any);

      const result = await authRepository.findNameById(authUserId);

      expect(mockPrisma.authUser.findUnique).toHaveBeenCalledWith(expect.any(Object));
      expect(result).toEqual(expectedResult);
    });

    test("기사 프로필 이미지가 있을 때 이름과 이미지 URL을 반환해야 합니다.", async () => {
      const userWithDriverImage = {
        name: "테스트기사",
        customer: null,
        driver: { profileImage: "driver.jpg" }
      };
      const expectedResult = { name: "테스트기사", profileImage: "driver.jpg" };
      mockPrisma.authUser.findUnique.mockResolvedValue(userWithDriverImage as any);

      const result = await authRepository.findNameById(authUserId);

      expect(result).toEqual(expectedResult);
    });

    test("사용자를 찾을 수 없을 때 null을 반환해야 합니다.", async () => {
      mockPrisma.authUser.findUnique.mockResolvedValue(null);
      const result = await authRepository.findNameById(authUserId);
      expect(result).toBeNull();
    });
  });

  describe("findByProviderId", () => {
    test("주어진 provider와 providerId로 AuthUser를 찾아야 합니다.", async () => {
      const provider = AuthProvider.KAKAO;
      const providerId = "kakao-123";
      const expectedUser = { id: authUserId, provider, providerId };
      mockPrisma.authUser.findFirst.mockResolvedValue(expectedUser as any);

      const result = await authRepository.findByProviderId(provider, providerId);

      expect(mockPrisma.authUser.findFirst).toHaveBeenCalledWith({
        where: { provider, providerId },
        include: { customer: true, driver: true }
      });
      expect(result).toEqual(expectedUser);
    });
  });

  describe("findAuthUserWithPassword", () => {
    test("주어진 ID로 비밀번호를 포함한 AuthUser를 찾아야 합니다.", async () => {
      const expectedUser = { id: authUserId, password: "hashedPassword" };
      mockPrisma.authUser.findUnique.mockResolvedValue(expectedUser as any);

      const result = await authRepository.findAuthUserWithPassword(authUserId);

      expect(mockPrisma.authUser.findUnique).toHaveBeenCalledWith({
        where: { id: authUserId }
      });
      expect(result).toEqual(expectedUser);
    });
  });

  describe("createAuthUser", () => {
    test("주어진 데이터로 AuthUser를 생성해야 합니다.", async () => {
      const userData = { email, password: "hashedPassword", name: "New User", userType: UserType.CUSTOMER };
      const expectedUser = { id: "new-user-id", ...userData };
      mockPrisma.authUser.create.mockResolvedValue(expectedUser as any);

      const result = await authRepository.createAuthUser(userData as any);

      expect(mockPrisma.authUser.create).toHaveBeenCalledWith({ data: userData });
      expect(result).toEqual(expectedUser);
    });
  });

  describe("updateAuthUser", () => {
    test("주어진 데이터로 AuthUser를 수정해야 합니다.", async () => {
      const updateData = { name: "Updated Name" };
      mockPrisma.authUser.update.mockResolvedValue(undefined as any);

      await authRepository.updateAuthUser(authUserId, updateData);

      expect(mockPrisma.authUser.update).toHaveBeenCalledWith({
        where: { id: authUserId },
        data: updateData
      });
    });
  });

  describe("findAuthUserProfileById", () => {
    test("주어진 프로필 ID로 AuthUser의 ID와 이름을 찾아야 합니다.", async () => {
      const profileId = "profile-id-1";
      const expectedUser = { id: authUserId, name: "Test User" };
      mockPrisma.authUser.findMany.mockResolvedValue([expectedUser] as any);

      const result = await authRepository.findAuthUserProfileById(profileId);

      expect(mockPrisma.authUser.findMany).toHaveBeenCalledWith({
        where: {
          OR: [{ customer: { id: profileId } }, { driver: { id: profileId } }]
        },
        select: {
          id: true,
          name: true
        },
        take: 1
      });
      expect(result).toEqual(expectedUser);
    });
  });
});
