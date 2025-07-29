import addressController from "../controllers/address.controller";
import addressService from "../services/address.service";
import { CustomError } from "../utils/customError";

jest.mock("../services/address.service");

describe("Address Controller", () => {
  const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };
  const mockRequest = (body = {}) => ({ body }) as any;
  const next = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createAddress", () => {
    test("모든 필드가 올바르면 주소를 생성하고 201을 반환한다", async () => {
      const req = mockRequest({
        postalCode: "12345",
        street: "서울 강남대로",
        detail: "101호",
        region: "SEOUL",
        district: "강남구"
      });
      const res = mockResponse();

      const mockAddress = {
        id: "addr-123",
        postalCode: "12345",
        street: "서울 강남대로",
        detail: "101호",
        region: "SEOUL",
        district: "강남구"
      };

      (addressService.createAddress as jest.Mock).mockResolvedValue(mockAddress);

      await addressController.createAddress(req, res, next);

      expect(addressService.createAddress).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockAddress);
    });

    test("필수 필드가 누락되면 400 에러를 발생시킨다", async () => {
      const req = mockRequest({
        postalCode: "12345",
        region: "SEOUL"
      });
      const res = mockResponse();

      await addressController.createAddress(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
      const error = (next as jest.Mock).mock.calls[0][0];
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe("필수 주소 정보가 누락되었습니다.");
    });

    test("region 값이 enum에 없으면  400 에러를 발생시킨다", async () => {
      const req = mockRequest({
        postalCode: "99999",
        street: "서울 마포대로",
        detail: "102호",
        region: "INVALID",
        district: "마포구"
      });
      const res = mockResponse();

      (addressService.createAddress as jest.Mock).mockImplementation(() => {
        throw new CustomError(400, "유효하지 않은 지역입니다.");
      });

      await addressController.createAddress(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
      const error = (next as jest.Mock).mock.calls[0][0];
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe("유효하지 않은 지역입니다.");
    });
  });
});
