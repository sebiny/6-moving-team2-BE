import prisma from "../config/prisma";
import favoriteRepository from "./favorite.repository";

jest.mock("../config/prisma", () => ({
  favorite: {
    findMany: jest.fn(),
    create: jest.fn(),
    delete: jest.fn()
  }
}));

const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

describe("Favorite Repository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  const mockData = [
    {
      id: "fav1",
      customerId: "cust1",
      driverId: "driver1",
      createdAt: new Date(),
      updatedAt: new Date(),
      driver: {
        id: "driver1",
        nickname: "홍길동",
        shortIntro: "친절한 기사",
        detailIntro: "10년 경력",
        moveType: ["SMALL", "OFFICE"],
        career: 10,
        work: 50,
        profileImage: null,
        authUser: { name: "홍길동" },
        _count: {
          reviewsReceived: 5,
          favorite: 20
        }
      }
    }
  ];
  const mockFavorite = {
    id: "fav1",
    customerId: "cust1",
    driverId: "driver1",
    createdAt: new Date(),
    updatedAt: new Date()
  };
  describe("GetAllFavoriteDrivers", () => {
    test("최대 3명의 찜한 기사를 반환한다.", async () => {
      (mockedPrisma.favorite.findMany as jest.Mock).mockResolvedValue(mockData);
      const result = await favoriteRepository.getAllFavoriteDrivers("cust1");
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: "driver1",
          nickname: "홍길동",
          shortIntro: "친절한 기사",
          detailIntro: "10년 경력",
          moveType: ["SMALL", "OFFICE"],
          reviewCount: 5,
          favoriteCount: 20
        })
      );
    });
  });
  describe("createFavorite", () => {
    test("찜하지 않은 기사일 경우 찜한 후 반환한다.", async () => {
      (mockedPrisma.favorite.create as jest.Mock).mockResolvedValue(mockFavorite);
      const result = await favoriteRepository.createFavorite("driver1", "cust1");
      expect(mockedPrisma.favorite.create).toHaveBeenCalledWith({
        data: { customerId: "cust1", driverId: "driver1" }
      });
      expect(result).toEqual(mockFavorite);
    });
    test("찜한 기사일 경우 에러", async () => {
      (mockedPrisma.favorite.create as jest.Mock).mockRejectedValue(new Error("이미 찜한 기사입니다."));
      await expect(favoriteRepository.createFavorite("driver1", "cust1")).rejects.toThrow("이미 찜한 기사입니다.");
    });
  });
  describe("deleteFavorite", () => {
    test("찜한 기사일 경우 찜 해제한 후 반환한다.", async () => {
      (mockedPrisma.favorite.delete as jest.Mock).mockResolvedValue(mockFavorite);
      const result = await favoriteRepository.deleteFavorite("driver1", "cust1");
      expect(mockedPrisma.favorite.delete).toHaveBeenCalledWith({
        where: { customerId_driverId: { driverId: "driver1", customerId: "cust1" } }
      });
      expect(result).toEqual(mockFavorite);
    });
    test("찜하지 않은 기사일 경우 에러", async () => {
      (mockedPrisma.favorite.delete as jest.Mock).mockRejectedValue(new Error("찜한 정보가 없습니다."));
      await expect(favoriteRepository.deleteFavorite("driver1", "cust1")).rejects.toThrow("찜한 정보가 없습니다.");
    });
  });
});
