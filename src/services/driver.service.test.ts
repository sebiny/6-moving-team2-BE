import driverRepository from "../repositories/driver.repository";
import estimateReqRepository from "../repositories/estimateReq.repository";
import { CustomError } from "../utils/customError";
import driverService from "./driver.service";

jest.mock("../repositories/driver.repository");
jest.mock("../repositories/estimateReq.repository");
const mockedDriverRepository = driverRepository as jest.Mocked<typeof driverRepository>;
const mockedEstimateReqRepository = estimateReqRepository as jest.Mocked<typeof estimateReqRepository>;
describe("Driver Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllDrivers", () => {
    test("조건에 맞는 기사를 반환한다.", async () => {
      const mockOptions = { keyword: "홍", page: 1 };
      const mockDrivers = [{ id: "d1", nickname: "홍길동" }];
      (mockedDriverRepository.getAllDrivers as jest.Mock).mockResolvedValue(mockDrivers);
      const result = await driverService.getAllDrivers(mockOptions);
      expect(driverRepository.getAllDrivers).toHaveBeenCalledWith(mockOptions, undefined);
      expect(result).toEqual(mockDrivers);
    });
  });
  describe("getDriverById", () => {
    test("견적요청이 되어있지 않은 경우 해당 기사의 정보만 반환한다.", async () => {
      const mockDriver = { id: "d1", nickname: "홍길동" };

      (mockedDriverRepository.getDriverById as jest.Mock).mockResolvedValue(mockDriver);
      (mockedEstimateReqRepository.findActiveEstimateRequest as jest.Mock).mockResolvedValue(null);

      const result = await driverService.getDriverById("d1", "user123");

      expect(driverRepository.getDriverById).toHaveBeenCalledWith("d1", "user123");
      expect(result).toEqual({ ...mockDriver, isDesignated: false });
    });
    test("지정견적이 되었있을 경우 관련 정보를 반환한다.", async () => {
      const mockDriver = { id: "d1", nickname: "홍길동" };
      const mockRequest = {
        designatedDrivers: [{ driverId: "d1" }]
      };

      (mockedDriverRepository.getDriverById as jest.Mock).mockResolvedValue(mockDriver);
      (mockedEstimateReqRepository.findActiveEstimateRequest as jest.Mock).mockResolvedValue(mockRequest);

      const result = await driverService.getDriverById("d1", "user123");

      expect(result).toEqual({ ...mockDriver, isDesignated: true });
    });
  });
});
