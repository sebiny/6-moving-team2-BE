import favoriteRepository from "../repositories/favorite.repository";
import { CustomError } from "../utils/customError";
import favoriteService from "./favorite.service";

jest.mock("../repositories/favorite.repository");
const mockedFavoriteRepository = favoriteRepository as jest.Mocked<typeof favoriteRepository>;

describe("Favorite Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  const mockData = [
    {
      id: "driver1",
      nickname: "홍길동",
      shortIntro: "빠르고 안전한 기사",
      detailIntro: "10년 경력의 이사 전문가입니다.",
      moveType: ["소형", "대형"],
      career: 10,
      work: 120,
      profileImage: null,
      authUser: { id: "auth1", name: "홍길동" },
      reviewCount: 15,
      favoriteCount: 5
    }
  ];
  const mockFavorite = {
    id: "fav1",
    customerId: "cust1",
    driverId: "driver1",
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null
  };
  describe("getAllFavoriteDrivers", () => {
    test("찜한 기사를 반환한다.", async () => {
      mockedFavoriteRepository.getAllFavoriteDrivers.mockResolvedValue(mockData);

      const result = await favoriteService.getAllFavoriteDrivers("cust1", 3);
      expect(result).toEqual(mockData);
      expect(mockedFavoriteRepository.getAllFavoriteDrivers).toHaveBeenCalledWith("cust1", 3);
    });
  });
  describe("createFavorite", () => {
    test("기사를 찜한다.", async () => {
      mockedFavoriteRepository.createFavorite.mockResolvedValue(mockFavorite);

      const result = await favoriteService.createFavorite("driver1", "cust1");
      expect(result).toEqual(mockFavorite);
    });
    test("이미 찜한 기사일 경우 에러를 발생시킨다.", async () => {
      const error = { code: "P2002" };
      mockedFavoriteRepository.createFavorite.mockRejectedValue(error);

      await expect(favoriteService.createFavorite("driver1", "cust1")).rejects.toThrow(CustomError);
    });
  });
  describe("deleteFavorite", () => {
    test("찜한 기사를 해제한다.", async () => {
      mockedFavoriteRepository.deleteFavorite.mockResolvedValue(mockFavorite);

      const result = await favoriteService.deleteFavorite("driver1", "cust1");
      expect(result).toEqual(mockFavorite);
    });
    test("이미 찜 해제한 기사일 경우 에러를 발생시킨다.", async () => {
      const error = { code: "P2025" };
      mockedFavoriteRepository.deleteFavorite.mockRejectedValue(error);

      await expect(favoriteService.deleteFavorite("driver1", "cust1")).rejects.toThrow(CustomError);
    });
  });
});
