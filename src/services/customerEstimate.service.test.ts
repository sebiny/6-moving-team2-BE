import customerEstimateService from "./customerEstimate.service";
import customerEstimateRepository from "../repositories/customerEstimate.repository";
import { CustomError } from "../utils/customError";

jest.mock("../repositories/customerEstimate.repository", () => ({
  getPendingEstimatesByCustomerId: jest.fn(),
  getReceivedEstimatesByCustomerId: jest.fn(),
  acceptEstimateById: jest.fn(),
  getEstimateDetailById: jest.fn(),
  getCustomerAndDriverIdbyEstimateId: jest.fn()
}));

describe("고객 견적 서비스 (customerEstimateService)", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("대기 중인 견적 조회 (getPendingEstimates)", () => {
    it("고객 ID가 없으면 오류를 발생시킨다.", async () => {
      await expect(customerEstimateService.getPendingEstimates("")).rejects.toThrow(CustomError);
    });

    it("레포지토리에서 데이터를 정상적으로 반환한다.", async () => {
      (customerEstimateRepository.getPendingEstimatesByCustomerId as jest.Mock).mockResolvedValue("대기중 데이터");

      const result = await customerEstimateService.getPendingEstimates("cust-1");
      expect(result).toBe("대기중 데이터");
      expect(customerEstimateRepository.getPendingEstimatesByCustomerId).toHaveBeenCalledWith("cust-1");
    });
  });

  describe("받았던 견적 조회 (getReceivedEstimates)", () => {
    it("고객 ID가 없으면 오류를 발생시킨다.", async () => {
      await expect(customerEstimateService.getReceivedEstimates("")).rejects.toThrow(CustomError);
    });

    it("레포지토리에서 데이터를 정상적으로 반환한다.", async () => {
      (customerEstimateRepository.getReceivedEstimatesByCustomerId as jest.Mock).mockResolvedValue("받은 견적 데이터");

      const result = await customerEstimateService.getReceivedEstimates("cust-2");
      expect(result).toBe("받은 견적 데이터");
      expect(customerEstimateRepository.getReceivedEstimatesByCustomerId).toHaveBeenCalledWith("cust-2");
    });
  });

  describe("견적 확정하기 (acceptEstimate)", () => {
    it("견적 ID가 없으면 오류를 발생시킨다.", async () => {
      await expect(customerEstimateService.acceptEstimate("")).rejects.toThrow(CustomError);
    });

    it("레포지토리에서 데이터를 정상적으로 반환한다.", async () => {
      (customerEstimateRepository.acceptEstimateById as jest.Mock).mockResolvedValue("견적 확정 완료");

      const result = await customerEstimateService.acceptEstimate("est-1");
      expect(result).toBe("견적 확정 완료");
      expect(customerEstimateRepository.acceptEstimateById).toHaveBeenCalledWith("est-1");
    });
  });

  describe("견적 상세 조회 (getEstimateDetail)", () => {
    it("견적 ID가 없으면 오류를 발생시킨다.", async () => {
      await expect(customerEstimateService.getEstimateDetail("")).rejects.toThrow(CustomError);
    });

    it("레포지토리에서 null을 반환하면 404 오류를 발생시킨다.", async () => {
      (customerEstimateRepository.getEstimateDetailById as jest.Mock).mockResolvedValue(null);

      await expect(customerEstimateService.getEstimateDetail("est-404")).rejects.toThrow(CustomError);
    });

    it("레포지토리에서 데이터를 정상적으로 반환한다.", async () => {
      (customerEstimateRepository.getEstimateDetailById as jest.Mock).mockResolvedValue("견적 상세 데이터");

      const result = await customerEstimateService.getEstimateDetail("est-1");
      expect(result).toBe("견적 상세 데이터");
      expect(customerEstimateRepository.getEstimateDetailById).toHaveBeenCalledWith("est-1");
    });
  });

  describe("견적 ID로 고객/기사 ID 조회 (getCustomerAndDriverIdbyEstimateId)", () => {
    it("견적 ID가 없으면 오류를 발생시킨다.", async () => {
      await expect(customerEstimateService.getCustomerAndDriverIdbyEstimateId("")).rejects.toThrow(CustomError);
    });

    it("레포지토리에서 데이터를 정상적으로 반환한다.", async () => {
      (customerEstimateRepository.getCustomerAndDriverIdbyEstimateId as jest.Mock).mockResolvedValue("ID 정보");

      const result = await customerEstimateService.getCustomerAndDriverIdbyEstimateId("est-2");
      expect(result).toBe("ID 정보");
      expect(customerEstimateRepository.getCustomerAndDriverIdbyEstimateId).toHaveBeenCalledWith("est-2");
    });
  });
});
