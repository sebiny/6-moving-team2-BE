import addressService from "../services/address.service";
import addressRepository from "../repositories/address.repository";
import { RegionType } from "@prisma/client";
import { CustomError } from "../utils/customError";

jest.mock("../repositories/address.repository");

describe("Address Service", () => {
  const baseInput = {
    postalCode: " 12345 ",
    street: " 서울시 강남구 ",
    detail: " 101호 ",
    region: "SEOUL" as RegionType,
    district: "강남구"
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createAddress - region 유효성 검사", () => {
    test("유효하지 않은 region이면 400 에러를 반환한다", async () => {
      const invalidInput = { ...baseInput, region: "INVALID" as RegionType };
      await expect(addressService.createAddress(invalidInput)).rejects.toThrow(CustomError);
    });
  });

  describe("createAddress - 중복 주소 확인", () => {
    test("동일한 주소가 이미 존재하면 기존 주소를 반환한다", async () => {
      const trimmed = {
        postalCode: "12345",
        street: "서울시 강남구",
        detail: "101호"
      };
      const mockExisting = { id: "addr-1", ...trimmed, region: "SEOUL", district: "강남구" };
      (addressRepository.findAddressByFields as jest.Mock).mockResolvedValue(mockExisting);

      const result = await addressService.createAddress(baseInput);

      expect(addressRepository.findAddressByFields).toHaveBeenCalledWith(
        trimmed.postalCode,
        trimmed.street,
        trimmed.detail
      );
      expect(result).toEqual(mockExisting);
    });
  });

  describe("createAddress - 신규 주소 생성", () => {
    test("중복 주소가 없으면 새 주소를 생성하여 반환한다", async () => {
      (addressRepository.findAddressByFields as jest.Mock).mockResolvedValue(null);
      const created = { id: "addr-2", ...baseInput };
      (addressRepository.createAddress as jest.Mock).mockResolvedValue(created);

      const result = await addressService.createAddress(baseInput);

      expect(addressRepository.createAddress).toHaveBeenCalledWith({
        ...baseInput,
        postalCode: "12345",
        street: "서울시 강남구",
        detail: "101호"
      });
      expect(result).toEqual(created);
    });
  });

  describe("createAddress - detail 입력값 케이스 처리", () => {
    test("detail이 undefined인 경우도 정상 처리된다", async () => {
      const input = { ...baseInput, detail: undefined };
      const expected = { id: "addr-3", ...input };
      (addressRepository.findAddressByFields as jest.Mock).mockResolvedValue(null);
      (addressRepository.createAddress as jest.Mock).mockResolvedValue(expected);

      const result = await addressService.createAddress(input);

      expect(addressRepository.findAddressByFields).toHaveBeenCalledWith("12345", "서울시 강남구", undefined);
      expect(result.id).toBe("addr-3");
    });

    test("detail이 null인 경우도 정상 처리된다", async () => {
      const input = { ...baseInput, detail: null as any };
      const expected = { id: "addr-4", ...input };
      (addressRepository.findAddressByFields as jest.Mock).mockResolvedValue(null);
      (addressRepository.createAddress as jest.Mock).mockResolvedValue(expected);

      const result = await addressService.createAddress(input);

      expect(addressRepository.findAddressByFields).toHaveBeenCalledWith("12345", "서울시 강남구", null);
      expect(result.id).toBe("addr-4");
    });

    test("detail이 공백 문자열일 경우 빈 문자열로 변환되어 처리된다", async () => {
      const input = { ...baseInput, detail: "   " };
      const expected = { id: "addr-5", ...input };
      (addressRepository.findAddressByFields as jest.Mock).mockResolvedValue(null);
      (addressRepository.createAddress as jest.Mock).mockResolvedValue(expected);

      const result = await addressService.createAddress(input);

      expect(addressRepository.findAddressByFields).toHaveBeenCalledWith("12345", "서울시 강남구", "");
      expect(result.id).toBe("addr-5");
    });
  });
});
