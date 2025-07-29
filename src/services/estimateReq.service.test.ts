import estimateReqService from "../services/estimateReq.service";
import estimateReqRepository from "../repositories/estimateReq.repository";
import { CustomError } from "../utils/customError";
import { MoveType, RequestStatus, AddressRole } from "@prisma/client";

jest.mock("../repositories/estimateReq.repository");

describe("EstimateReq Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("linkCustomerAddress - 고객 주소 연결", () => {
    test("고객 주소 연결을 정상적으로 수행한다", async () => {
      const input = {
        customerId: "cust-123",
        addressId: "addr-456",
        role: AddressRole.FROM
      };
      const mockResult = { id: "linked-789", ...input };
      (estimateReqRepository.linkCustomerAddress as jest.Mock).mockResolvedValue(mockResult);

      const result = await estimateReqService.linkCustomerAddress(input);
      expect(result).toEqual(mockResult);
    });
  });

  describe("getCustomerAddressesByRole - 고객 주소 목록 조회", () => {
    test("고객 ID와 역할로 주소 목록을 반환한다", async () => {
      const mockAddresses = [
        { id: "addr-1", role: AddressRole.FROM },
        { id: "addr-2", role: AddressRole.FROM }
      ];

      (estimateReqRepository.getCustomerAddressesByRole as jest.Mock).mockResolvedValue(mockAddresses);

      const result = await estimateReqService.getCustomerAddressesByRole("cust-123", "FROM");
      expect(result).toEqual(mockAddresses);
    });
  });

  describe("createEstimateRequest - 일반 견적 요청 생성", () => {
    const baseData = {
      customerId: "cust-1",
      moveType: MoveType.HOME,
      moveDate: new Date(Date.now() + 86400000),
      fromAddressId: "addr-1",
      toAddressId: "addr-2",
      status: RequestStatus.PENDING
    };

    test("진행 중인 견적 요청이 있는 경우 409 에러를 반환한다", async () => {
      (estimateReqRepository.findActiveEstimateRequest as jest.Mock).mockResolvedValue({ id: "req-1" });

      await expect(estimateReqService.createEstimateRequest(baseData)).rejects.toThrow(CustomError);
    });

    test("출발지와 도착지가 같은 경우 400 에러를 반환한다", async () => {
      (estimateReqRepository.findActiveEstimateRequest as jest.Mock).mockResolvedValue(null);

      await expect(
        estimateReqService.createEstimateRequest({
          ...baseData,
          fromAddressId: "same-id",
          toAddressId: "same-id"
        })
      ).rejects.toThrow("출발지와 도착지는 서로 달라야 합니다.");
    });

    test("이사 날짜가 과거인 경우 400 에러를 반환한다", async () => {
      (estimateReqRepository.findActiveEstimateRequest as jest.Mock).mockResolvedValue(null);

      await expect(
        estimateReqService.createEstimateRequest({
          ...baseData,
          moveDate: new Date(Date.now() - 86400000)
        })
      ).rejects.toThrow("이전 날짜로 이사를 요청할 수 없습니다.");
    });

    test("조건이 모두 충족되면 견적 요청을 생성하여 반환한다", async () => {
      const mockResult = { id: "req-123", ...baseData };
      (estimateReqRepository.findActiveEstimateRequest as jest.Mock).mockResolvedValue(null);
      (estimateReqRepository.createEstimateRequest as jest.Mock).mockResolvedValue(mockResult);

      const result = await estimateReqService.createEstimateRequest(baseData);

      expect(result).toEqual(mockResult);
    });
  });

  describe("createDesignatedEstimateRequest - 지정 견적 요청 생성", () => {
    const customerId = "cust-1";
    const driverId = "drv-1";

    test("진행 중인 일반 견적 요청이 없는 경우 400 에러를 반환한다", async () => {
      (estimateReqRepository.findActiveEstimateRequest as jest.Mock).mockResolvedValue(null);

      await expect(estimateReqService.createDesignatedEstimateRequest(customerId, driverId)).rejects.toThrow(
        "진행 중인 일반 견적 요청이 없습니다."
      );
    });

    test("이미 확정된 요청인 경우 409 에러를 반환한다", async () => {
      (estimateReqRepository.findActiveEstimateRequest as jest.Mock).mockResolvedValue({
        id: "req-1",
        status: "APPROVED",
        designatedDrivers: []
      });

      await expect(estimateReqService.createDesignatedEstimateRequest(customerId, driverId)).rejects.toThrow(
        "이미 기사님이 확정된 요청에는 지정 요청을 할 수 없습니다."
      );
    });

    test("이미 지정된 기사인 경우 409 에러를 반환한다", async () => {
      (estimateReqRepository.findActiveEstimateRequest as jest.Mock).mockResolvedValue({
        id: "req-1",
        status: "PENDING",
        designatedDrivers: [{ driverId }]
      });

      await expect(estimateReqService.createDesignatedEstimateRequest(customerId, driverId)).rejects.toThrow(
        "이미 지정된 기사님입니다."
      );
    });

    test("지정 기사 수가 3명을 초과하는 경우 409 에러를 반환한다", async () => {
      (estimateReqRepository.findActiveEstimateRequest as jest.Mock).mockResolvedValue({
        id: "req-1",
        status: "PENDING",
        designatedDrivers: []
      });
      (estimateReqRepository.getDesignatedDriverCount as jest.Mock).mockResolvedValue(3);

      await expect(estimateReqService.createDesignatedEstimateRequest(customerId, driverId)).rejects.toThrow(
        "최대 3명의 기사님만 지정할 수 있습니다."
      );
    });

    test("조건이 충족되면 지정 견적 요청을 생성하여 반환한다", async () => {
      const activeReq = {
        id: "req-1",
        status: "PENDING",
        designatedDrivers: []
      };
      const created = {
        id: "designated-1",
        estimateRequestId: "req-1",
        driverId
      };

      (estimateReqRepository.findActiveEstimateRequest as jest.Mock).mockResolvedValue(activeReq);
      (estimateReqRepository.getDesignatedDriverCount as jest.Mock).mockResolvedValue(2);
      (estimateReqRepository.createDesignatedDriver as jest.Mock).mockResolvedValue(created);

      const result = await estimateReqService.createDesignatedEstimateRequest(customerId, driverId);

      expect(result).toEqual(created);
    });
  });

  describe("getActiveEstimateRequest - 활성 견적 요청 조회", () => {
    test("활성 견적 요청이 존재하면 반환한다", async () => {
      const mockRequest = { id: "req-1", status: "PENDING" };
      (estimateReqRepository.findActiveEstimateRequest as jest.Mock).mockResolvedValue(mockRequest);

      const result = await estimateReqService.getActiveEstimateRequest("cust-1");
      expect(result).toEqual(mockRequest);
    });

    test("활성 견적 요청이 없으면 null을 반환한다", async () => {
      (estimateReqRepository.findActiveEstimateRequest as jest.Mock).mockResolvedValue(null);

      const result = await estimateReqService.getActiveEstimateRequest("cust-1");
      expect(result).toBeNull();
    });
  });
});
