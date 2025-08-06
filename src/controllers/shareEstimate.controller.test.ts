import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import shareEstimateController from "./shareEstimate.controller";
import prisma from "../config/prisma";

jest.mock("../../src/config/prisma", () => ({
  estimate: {
    findUnique: jest.fn()
  }
}));

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(),
  verify: jest.fn()
}));

const mockRequest = (params = {}, body = {}) =>
  ({
    params,
    body
  }) as unknown as Request;

const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("shareEstimate.controller", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createShareLink", () => {
    it("정상적으로 공유 링크를 생성한다.", async () => {
      (jwt.sign as jest.Mock).mockReturnValue("mocked.jwt.token");

      const req = mockRequest({ estimateId: "est-1" }, { sharedFrom: "DRIVER" });
      const res = mockResponse();

      await shareEstimateController.createShareLink(req, res);

      expect(jwt.sign).toHaveBeenCalledWith({ estimateId: "est-1", sharedFrom: "DRIVER" }, expect.any(String), {
        expiresIn: "7d"
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        shareUrl: "https://www.moving-2.click/estimate/shared/mocked.jwt.token"
      });
    });

    it("에러 발생 시 500 상태 코드와 메시지를 반환한다.", async () => {
      (jwt.sign as jest.Mock).mockImplementation(() => {
        throw new Error("JWT error");
      });

      const req = mockRequest({ estimateId: "est-1" }, {});
      const res = mockResponse();

      await shareEstimateController.createShareLink(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "공유 링크 생성 중 오류가 발생했습니다."
      });
    });
  });

  describe("getSharedEstimate", () => {
    it("정상적으로 견적 데이터를 반환한다.", async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ estimateId: "est-2", sharedFrom: "CUSTOMER" });
      (prisma.estimate.findUnique as jest.Mock).mockResolvedValue({ id: "est-2", driver: {}, estimateRequest: {} });

      const req = mockRequest({ token: "mock.token" });
      const res = mockResponse();

      await shareEstimateController.getSharedEstimate(req, res);

      expect(jwt.verify).toHaveBeenCalledWith("mock.token", expect.any(String));
      expect(prisma.estimate.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "est-2" }
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        id: "est-2",
        driver: {},
        estimateRequest: {},
        type: "CUSTOMER"
      });
    });

    it("견적이 없으면 404 상태 코드와 메시지를 반환한다.", async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ estimateId: "est-404", sharedFrom: "CUSTOMER" });
      (prisma.estimate.findUnique as jest.Mock).mockResolvedValue(null);

      const req = mockRequest({ token: "notfound.token" });
      const res = mockResponse();

      await shareEstimateController.getSharedEstimate(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "해당 견적을 찾을 수 없습니다."
      });
    });

    it("JWT 검증 실패 시 400 상태 코드와 메시지를 반환한다.", async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error("Invalid token");
      });

      const req = mockRequest({ token: "invalid.token" });
      const res = mockResponse();

      await shareEstimateController.getSharedEstimate(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "잘못되었거나 만료된 공유 링크입니다."
      });
    });
  });
});
