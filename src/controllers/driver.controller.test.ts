import { MoveType, RegionType } from "@prisma/client";
import driverService from "../services/driver.service";
import driverController from "./driver.controller";

jest.mock("../services/driver.service");
const mockedDriverService = driverService as jest.Mocked<typeof driverService>;

describe("Driver Controller", () => {
  const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };
  const mockRequest = (user = {}, query = {}, params = {}, body = {}) => ({ user, query, params, body }) as any;
  const next = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const res = mockResponse();

  const resultList = {
    data: [
      {
        id: "d2",
        name: "김철수",
        nickname: "김철수",
        authUserId: "auth123",
        isFavorite: false,
        reviewCount: 5,
        favoriteCount: 5,
        moveType: [MoveType.SMALL],
        serviceAreas: [
          {
            region: RegionType.SEOUL,
            id: "sa1",
            driverId: "d2",
            district: null
          }
        ],
        career: 3,
        work: 15,
        averageRating: 4.8,
        profileImage: null,
        shortIntro: "짧은 소개",
        detailIntro: "자세한 소개",
        deletedAt: null,
        languagePrefId: null
      }
    ],
    hasNext: false
  };
  const driver = {
    id: "d2",
    name: "김철수",
    nickname: "김철수",
    authUserId: "auth123",
    isFavorite: false,
    reviewCount: 5,
    favoriteCount: 5,
    moveType: [MoveType.SMALL],
    serviceAreas: [
      {
        region: RegionType.SEOUL,
        id: "sa1",
        driverId: "d2",
        district: null
      }
    ],
    career: 3,
    work: 15,
    averageRating: 4.8,
    profileImage: null,
    shortIntro: "짧은 소개",
    detailIntro: "자세한 소개",
    deletedAt: null,
    languagePrefId: null,
    isDesignated: false
  };

  describe("getAllDrivers", () => {
    test("비회원 기사 목록 조회 성공", async () => {
      const req = mockRequest(
        {},
        {
          keyword: "홍길동",
          orderBy: "reviewCount",
          region: "SEOUL",
          service: "OFFICE",
          page: "1"
        },
        { customerId: "c1" }
      );
      mockedDriverService.getAllDrivers.mockResolvedValue(resultList);

      await driverController.getAllDrivers(req, res, next);

      expect(mockedDriverService.getAllDrivers).toHaveBeenCalledWith({
        keyword: "홍길동",
        orderBy: "reviewCount",
        region: "SEOUL",
        service: "OFFICE",
        page: 1
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(resultList);
    });
  });

  describe("getAllDriversAuth", () => {
    test("회원 기사 목록 조회 성공", async () => {
      const req = mockRequest(
        { customerId: "c1" },
        {
          keyword: "홍길동",
          orderBy: "reviewCount",
          region: "SEOUL",
          service: "OFFICE",
          page: "1"
        }
      );
      mockedDriverService.getAllDrivers.mockResolvedValue(resultList);
      await driverController.getAllDriversAuth(req, res, next);

      expect(mockedDriverService.getAllDrivers).toHaveBeenCalledWith(
        {
          keyword: "홍길동",
          orderBy: "reviewCount",
          region: "SEOUL",
          service: "OFFICE",
          page: 1
        },
        "c1"
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(resultList);
    });
  });

  describe("getDriverById", () => {
    test("기사 상세 조회 (비회원)", async () => {
      const req = mockRequest({}, {}, { id: "d2" });

      mockedDriverService.getDriverById.mockResolvedValue(driver);

      await driverController.getDriverById(req, res, next);

      expect(mockedDriverService.getDriverById).toHaveBeenCalledWith("d2");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(driver);
    });
  });

  describe("getDriverByIdAuth", () => {
    test("기사 상세 조회 (회원)", async () => {
      const req = mockRequest({ customerId: "c1" }, {}, { id: "d2" });
      mockedDriverService.getDriverById.mockResolvedValue(driver);

      await driverController.getDriverByIdAuth(req, res, next);

      expect(mockedDriverService.getDriverById).toHaveBeenCalledWith("d2", "c1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(driver);
    });
  });
});
