import { jest } from "@jest/globals";
import type { DeepMockProxy } from "jest-mock-extended";
import { mockDeep, mockReset } from "jest-mock-extended";
import prisma from "../config/prisma";
import profileRepository from "./profile.repository";
import { MoveType, RegionType } from "@prisma/client";

// Prisma 클라이언트를 모의(mock) 처리합니다.
jest.mock("../config/prisma", () => ({
  __esModule: true,
  default: mockDeep<typeof prisma>()
}));

const mockPrisma = prisma as unknown as DeepMockProxy<typeof prisma>;

describe("ProfileRepository", () => {
  const authUserId = "auth-user-id-1";
  const driverId = "driver-id-1";

  beforeEach(() => {
    // 각 테스트 전에 모의 객체를 초기화합니다.
    mockReset(mockPrisma);
  });

  // findCustomerByAuthUserId 함수 테스트
  describe("findCustomerByAuthUserId", () => {
    it("주어진 authUserId로 고객 프로필을 찾아야 합니다.", async () => {
      const expectedProfile = { id: "customer-1", authUserId };
      mockPrisma.customer.findUnique.mockResolvedValue(expectedProfile as any);

      const result = await profileRepository.findCustomerByAuthUserId(authUserId);

      expect(mockPrisma.customer.findUnique).toHaveBeenCalledWith({
        where: { authUserId },
        include: { authUser: true }
      });
      expect(result).toEqual(expectedProfile);
    });
  });

  // createCustomerProfile 함수 테스트
  describe("createCustomerProfile", () => {
    it("주어진 데이터로 고객 프로필을 생성해야 합니다.", async () => {
      const profileData = { currentArea: "Seoul" };
      const expectedProfile = { id: "customer-1", ...profileData };
      mockPrisma.customer.create.mockResolvedValue(expectedProfile as any);

      const result = await profileRepository.createCustomerProfile(profileData as any);

      expect(mockPrisma.customer.create).toHaveBeenCalledWith({ data: profileData });
      expect(result).toEqual(expectedProfile);
    });
  });

  // updateCustomerProfile 함수 테스트
  describe("updateCustomerProfile", () => {
    it("주어진 데이터로 고객 프로필을 수정해야 합니다.", async () => {
      const updateData = { profileImage: "new-image.jpg" };
      const expectedProfile = { id: "customer-1", authUserId, ...updateData };
      mockPrisma.customer.update.mockResolvedValue(expectedProfile as any);

      const result = await profileRepository.updateCustomerProfile(authUserId, updateData);

      expect(mockPrisma.customer.update).toHaveBeenCalledWith({
        where: { authUserId },
        data: updateData,
        include: { authUser: true }
      });
      expect(result).toEqual(expectedProfile);
    });
  });

  // findDriverByAuthUserId 함수 테스트
  describe("findDriverByAuthUserId", () => {
    it("주어진 authUserId로 기사 프로필을 찾아야 합니다.", async () => {
      const expectedProfile = { id: driverId, authUserId, nickname: "Best Driver" };
      mockPrisma.driver.findUnique.mockResolvedValue(expectedProfile as any);

      const result = await profileRepository.findDriverByAuthUserId(authUserId);

      expect(mockPrisma.driver.findUnique).toHaveBeenCalledWith({
        where: { authUserId },
        include: { serviceAreas: true }
      });
      expect(result).toEqual(expectedProfile);
    });
  });

  // createDriverProfile 함수 테스트
  describe("createDriverProfile", () => {
    it("주어진 데이터로 기사 프로필을 생성해야 합니다.", async () => {
      const profileData = { nickname: "Best Driver", career: 5 };
      const expectedProfile = { id: driverId, ...profileData };
      mockPrisma.driver.create.mockResolvedValue(expectedProfile as any);

      const result = await profileRepository.createDriverProfile(profileData as any);

      expect(mockPrisma.driver.create).toHaveBeenCalledWith({
        data: profileData,
        include: { serviceAreas: true }
      });
      expect(result).toEqual(expectedProfile);
    });
  });

  // updateDriverProfile 함수 테스트
  describe("updateDriverProfile", () => {
    it("주어진 데이터로 기사 프로필을 수정해야 합니다.", async () => {
      const updateData = { nickname: "Even Better Driver" };
      const expectedProfile = { id: driverId, authUserId, ...updateData };
      mockPrisma.driver.update.mockResolvedValue(expectedProfile as any);

      const result = await profileRepository.updateDriverProfile(authUserId, updateData);

      expect(mockPrisma.driver.update).toHaveBeenCalledWith({
        where: { authUserId },
        data: updateData
      });
      expect(result).toEqual(expectedProfile);
    });
  });

  // deleteDriverServiceAreas 함수 테스트
  describe("deleteDriverServiceAreas", () => {
    it("주어진 driverId에 해당하는 모든 서비스 지역을 삭제해야 합니다.", async () => {
      mockPrisma.driverServiceArea.deleteMany.mockResolvedValue({ count: 2 });

      await profileRepository.deleteDriverServiceAreas(driverId);

      expect(mockPrisma.driverServiceArea.deleteMany).toHaveBeenCalledWith({
        where: { driverId }
      });
    });
  });

  // createDriverServiceAreas 함수 테스트
  describe("createDriverServiceAreas", () => {
    it("주어진 데이터로 여러 서비스 지역을 한 번에 생성해야 합니다.", async () => {
      const serviceAreasData = [
        { driverId, region: RegionType.SEOUL, district: "Gangnam" },
        { driverId, region: RegionType.BUSAN, district: "Haeundae" }
      ];
      mockPrisma.driverServiceArea.createMany.mockResolvedValue({ count: 2 });

      await profileRepository.createDriverServiceAreas(serviceAreasData);

      expect(mockPrisma.driverServiceArea.createMany).toHaveBeenCalledWith({
        data: serviceAreasData
      });
    });
  });
});
