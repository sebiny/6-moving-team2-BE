import prisma from "../config/prisma";
import addressRepository from "../repositories/address.repository";
import { RegionType } from "@prisma/client";

jest.mock("../config/prisma", () => ({
  address: {
    create: jest.fn(),
    findFirst: jest.fn()
  }
}));

describe("Address Repository", () => {
  const baseInput = {
    postalCode: "12345",
    street: "서울시 강남구",
    detail: "101호",
    region: "SEOUL" as RegionType,
    district: "강남구"
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createAddress - 주소 생성", () => {
    test("입력한 정보로 주소를 성공적으로 생성하고 결과를 반환한다", async () => {
      const mockResult = { id: "addr-1", ...baseInput };
      (prisma.address.create as jest.Mock).mockResolvedValue(mockResult);

      const result = await addressRepository.createAddress(baseInput);

      expect(prisma.address.create).toHaveBeenCalledWith({ data: baseInput });
      expect(result).toEqual(mockResult);
    });

    test("DB에서 주소 생성 중 오류가 발생하면 서버 오류(500)를 반환한다", async () => {
      (prisma.address.create as jest.Mock).mockRejectedValue(new Error("DB Error"));

      await expect(addressRepository.createAddress(baseInput)).rejects.toThrow("DB Error");
    });
  });

  describe("findAddressByFields - 주소 조건 검색", () => {
    test("입력한 주소 정보와 일치하는 주소가 존재하면 해당 주소를 반환한다", async () => {
      const mockResult = { id: "addr-2", ...baseInput };
      (prisma.address.findFirst as jest.Mock).mockResolvedValue(mockResult);

      const result = await addressRepository.findAddressByFields(
        baseInput.postalCode,
        baseInput.street,
        baseInput.detail
      );

      expect(prisma.address.findFirst).toHaveBeenCalledWith({
        where: {
          postalCode: baseInput.postalCode,
          street: baseInput.street,
          detail: baseInput.detail
        }
      });
      expect(result).toEqual(mockResult);
    });

    test("detail이 undefined일 경우 detail 필드는 제외하고 조건을 구성해 조회한다", async () => {
      (prisma.address.findFirst as jest.Mock).mockResolvedValue(null);

      await addressRepository.findAddressByFields("12345", "서울시 강남구", undefined);

      expect(prisma.address.findFirst).toHaveBeenCalledWith({
        where: {
          postalCode: "12345",
          street: "서울시 강남구"
        }
      });
    });

    test("detail이 null일 경우에도 detail 필드는 포함되지 않고 조회된다", async () => {
      (prisma.address.findFirst as jest.Mock).mockResolvedValue(null);

      await addressRepository.findAddressByFields("12345", "서울시 강남구", null);

      expect(prisma.address.findFirst).toHaveBeenCalledWith({
        where: {
          postalCode: "12345",
          street: "서울시 강남구",
          detail: null
        }
      });
    });

    test("detail이 빈 문자열일 경우에는 detail 필드를 포함하여 조회한다", async () => {
      (prisma.address.findFirst as jest.Mock).mockResolvedValue(null);

      await addressRepository.findAddressByFields("12345", "서울시 강남구", "");

      expect(prisma.address.findFirst).toHaveBeenCalledWith({
        where: {
          postalCode: "12345",
          street: "서울시 강남구",
          detail: ""
        }
      });
    });

    test("조건에 일치하는 주소가 없을 경우 null을 반환한다", async () => {
      (prisma.address.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await addressRepository.findAddressByFields("99999", "없는주소", "999호");

      expect(result).toBeNull();
    });

    test("조회 도중 DB 오류가 발생하면 서버 오류(500)를 반환한다", async () => {
      (prisma.address.findFirst as jest.Mock).mockRejectedValue(new Error("DB 실패"));

      await expect(addressRepository.findAddressByFields("12345", "서울시 강남구", "101호")).rejects.toThrow("DB 실패");
    });
  });
});
