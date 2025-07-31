import prisma from "../config/prisma";
import driverRepository from "./driver.repository";

jest.mock("../config/prisma", () => ({
  driver: {
    findMany: jest.fn(),
    findUnique: jest.fn()
  }
}));

const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

describe("Driver Repository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe("GetAllDrivers", () => {
    test("기본적으로 3명의 기사를 반환한다.", async () => {
      (mockedPrisma.driver.findMany as jest.Mock).mockResolvedValue([
        { id: "1", nickname: "홍길동", _count: { reviewsReceived: 5, favorite: 10 }, favorite: [], serviceAreas: [] },
        { id: "2", nickname: "임꺽정", _count: { reviewsReceived: 3, favorite: 2 }, favorite: [], serviceAreas: [] },
        { id: "3", nickname: "장보고", _count: { reviewsReceived: 1, favorite: 0 }, favorite: [], serviceAreas: [] },
        { id: "4", nickname: "이순신", _count: { reviewsReceived: 10, favorite: 4 }, favorite: [], serviceAreas: [] }
      ]);
      const result = await driverRepository.getAllDrivers({ page: 1 });
      expect(result.data).toHaveLength(3);
      expect(result.hasNext).toBe(true);
      expect(mockedPrisma.driver.findMany).toHaveBeenCalled();
    });

    test("검색 결과 일치하는 닉네임을 가지는 기사를 반환한다.", async () => {
      (mockedPrisma.driver.findMany as jest.Mock).mockResolvedValue([
        {
          id: "1",
          nickname: "홍길동",
          moveType: ["OFFICE"],
          _count: { reviewsReceived: 5, favorite: 10 },
          favorite: [],
          serviceAreas: [{ region: "SEOUL" }]
        }
      ]);
      const result = await driverRepository.getAllDrivers({ keyword: "홍", page: 1 });
      expect(result.data[0].nickname).toEqual("홍길동");
    });
    test("지역 필터링 결과 일치하는 서비스 지역을 가지는 기사를 반환한다.", async () => {
      (mockedPrisma.driver.findMany as jest.Mock).mockResolvedValue([
        {
          id: "3",
          nickname: "장보고",
          moveType: ["OFFICE", "HOME"],
          _count: { reviewsReceived: 1, favorite: 0 },
          favorite: [],
          serviceAreas: [{ region: "DAEGU" }]
        }
      ]);
      const result = await driverRepository.getAllDrivers({ region: "DAEGU", page: 1 });
      expect(result.data[0].serviceAreas[0].region).toEqual("DAEGU");
    });
    test("서비스 필터링 결과 일치하는 서비스를 제공하는 기사를 반환한다.", async () => {
      (mockedPrisma.driver.findMany as jest.Mock).mockResolvedValue([
        {
          id: "2",
          nickname: "임꺽정",
          moveType: ["OFFICE", "SMALL"],
          _count: { reviewsReceived: 3, favorite: 2 },
          favorite: [],
          serviceAreas: [{ region: "BUSAN" }]
        }
      ]);
      const result = await driverRepository.getAllDrivers({ service: "SMALL", page: 1 });
      expect(result.data[0].moveType).toContain("SMALL");
    });
    test("정렬 기준에 따른 기사를 반환한다.", async () => {
      (mockedPrisma.driver.findMany as jest.Mock).mockResolvedValue([
        { id: "1", nickname: "홍길동", _count: { reviewsReceived: 10, favorite: 10 }, favorite: [], serviceAreas: [] },
        { id: "2", nickname: "임꺽정", _count: { reviewsReceived: 8, favorite: 2 }, favorite: [], serviceAreas: [] },
        { id: "3", nickname: "장보고", _count: { reviewsReceived: 5, favorite: 0 }, favorite: [], serviceAreas: [] },
        { id: "4", nickname: "이순신", _count: { reviewsReceived: 3, favorite: 4 }, favorite: [], serviceAreas: [] }
      ]);
      const result = await driverRepository.getAllDrivers({ page: 1 });
      expect(result.data[0].reviewCount).toEqual(10);
    });
    test("찜한 기사님일 경우 찜한 결과가 반영된 기사를 반환한다.", async () => {
      (mockedPrisma.driver.findMany as jest.Mock).mockResolvedValue([
        {
          id: "1",
          nickname: "홍길동",
          _count: { reviewsReceived: 3, favorite: 2 },
          favorite: [{ id: "fav1" }],
          serviceAreas: []
        }
      ]);
      const result = await driverRepository.getAllDrivers({ page: 1 }, "cust1");
      expect(result.data[0].isFavorite).toBe(true);
    });
    test("기사가 없을 경우 빈 리스트를 반환한다.", async () => {
      (mockedPrisma.driver.findMany as jest.Mock).mockResolvedValue([]);
      const result = await driverRepository.getAllDrivers({ page: 1 });
      expect(result.data).toHaveLength(0);
      expect(result.hasNext).toBe(false);
    });
  });
  describe("GetDriverById", () => {
    test("기사 ID에 따라 상세 정보를 반환한다.", async () => {
      (mockedPrisma.driver.findUnique as jest.Mock).mockResolvedValue({
        id: "driver1",
        nickname: "홍길동",
        _count: { reviewsReceived: 3, favorite: 5 },
        favorite: [{ id: "fav1" }],
        serviceAreas: []
      });

      const result = await driverRepository.getDriverById("driver1", "cust1");
      expect(result).not.toBeNull();
      expect(result!.id).toBe("driver1");
      expect(result!.isFavorite).toBe(true);
    });
    test("ID를 가진 기사가 없을 경우 ", async () => {
      (mockedPrisma.driver.findUnique as jest.Mock).mockResolvedValue(null);
      const result = await driverRepository.getDriverById("nope");
      expect(result).toBeNull();
    });
  });
});
