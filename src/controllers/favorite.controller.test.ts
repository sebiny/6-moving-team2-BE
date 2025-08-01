import favoriteService from "../services/favorite.service";
import favoriteController from "./favorite.controller";

jest.mock("../services/favorite.service");
const mockedFavoriteService = favoriteService as jest.Mocked<typeof favoriteService>;

describe("Favorite Controller", () => {
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

  describe("getAllFavoriteDrivers", () => {
    test("찜한 기사님 목록을 정상적으로 반환한다", async () => {
      const req = mockRequest({ customerId: "c123" }, { pageSize: "3" });
      const res = mockResponse();
      const mockResult = [{ id: "d1", name: "홍길동" }];
      (mockedFavoriteService.getAllFavoriteDrivers as jest.Mock).mockResolvedValue(mockResult);

      await favoriteController.getAllFavoriteDrivers(req, res, next);

      expect(mockedFavoriteService.getAllFavoriteDrivers).toHaveBeenCalledWith("c123", 3);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    test("인증 정보가 없으면 401 에러를 던진다", async () => {
      const req = mockRequest(undefined);
      const res = mockResponse();

      await favoriteController.getAllFavoriteDrivers(req, res, next);
      const error = (next as jest.Mock).mock.calls[0][0];
      expect(error.statusCode).toBe(401);
      expect(error.message).toContain("인증 정보가 없습니다.");
    });
  });

  describe("createFavorite", () => {
    test("찜 등록이 성공하면 201을 반환한다.", async () => {
      const req = mockRequest({ customerId: "c123" }, {}, { id: "d456" });
      const res = mockResponse();
      const mockResult = { id: "f1", driverId: "d456", customerId: "c123" };
      (mockedFavoriteService.createFavorite as jest.Mock).mockResolvedValue(mockResult);

      await favoriteController.createFavorite(req, res, next);

      expect(mockedFavoriteService.createFavorite).toHaveBeenCalledWith("d456", "c123");
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });
    test("인증 정보가 없으면 401 에러를 던진다", async () => {
      const req = mockRequest(undefined);
      const res = mockResponse();

      await favoriteController.createFavorite(req, res, next);
      const error = (next as jest.Mock).mock.calls[0][0];
      expect(error.statusCode).toBe(401);
      expect(error.message).toContain("인증 정보가 없습니다.");
    });
  });

  describe("deleteFavorite", () => {
    test("찜 삭제 시 204를 반환한다.", async () => {
      const req = mockRequest({ customerId: "c123" }, {}, { id: "d456" });
      const res = mockResponse();
      (mockedFavoriteService.deleteFavorite as jest.Mock).mockResolvedValue(undefined);
      const res204 = {
        status: jest.fn().mockReturnValue({ json: jest.fn() })
      };

      await favoriteController.deleteFavorite(req, res, next);

      expect(mockedFavoriteService.deleteFavorite).toHaveBeenCalledWith("d456", "c123");
      expect(res.status).toHaveBeenCalledWith(204);
    });
    test("인증 정보가 없으면 401 에러를 던진다", async () => {
      const req = mockRequest(undefined);
      const res = mockResponse();

      await favoriteController.deleteFavorite(req, res, next);
      const error = (next as jest.Mock).mock.calls[0][0];
      expect(error.statusCode).toBe(401);
      expect(error.message).toContain("인증 정보가 없습니다.");
    });
  });
});
