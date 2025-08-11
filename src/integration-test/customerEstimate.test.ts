import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../app";
import { EstimateStatus, RequestStatus, UserType, MoveType, RegionType } from "@prisma/client";
import { resetDB } from "../utils/resetDB";
import prisma from "../config/prisma";

const BASE = "/customer/estimate";

// JWT 도우미
function signAccessToken(payload: { id: string; userType: UserType; customerId: string }) {
  const secret = process.env.JWT_SECRET || "test_secret";
  return jwt.sign(payload, secret, { expiresIn: "1h" });
}

describe("Customer Estimate API (integration)", () => {
  // 고객/토큰
  let customerAuthUserId = "";
  let customerId = "";
  let token = "";

  // 기사
  let driver1Id = "";
  let driver2Id = "";

  // 주소
  let fromAddressId = "";
  let toAddressId = "";

  // 요청/견적
  let pendingRequestId = "";
  let estimateByDriver1Id = "";
  let estimateByDriver2Id = "";

  const uniq = Date.now(); // 유니크 보장용

  beforeAll(async () => {
    await resetDB();

    // 1) 고객
    const customerAuth = await prisma.authUser.create({
      data: {
        email: `cust_${uniq}@test.com`,
        name: "고객A",
        phone: "010-1111-2222",
        userType: UserType.CUSTOMER
      }
    });
    customerAuthUserId = customerAuth.id;

    const customer = await prisma.customer.create({
      data: {
        authUserId: customerAuthUserId,
        moveType: [MoveType.HOME],
        currentArea: "서울시 종로구"
      }
    });
    customerId = customer.id;

    // 2) 기사 2명 (유니크 제약 회피용)
    const d1Auth = await prisma.authUser.create({
      data: {
        email: `drv1_${uniq}@test.com`,
        name: "기사1",
        phone: "010-3333-4444",
        userType: UserType.DRIVER
      }
    });
    const driver1 = await prisma.driver.create({
      data: {
        authUserId: d1Auth.id,
        nickname: `driver_one_${uniq}`,
        shortIntro: "짧은 소개 1",
        detailIntro: "상세 소개 1",
        moveType: [MoveType.SMALL, MoveType.HOME],
        career: 5,
        work: 10
      }
    });
    driver1Id = driver1.id;

    const d2Auth = await prisma.authUser.create({
      data: {
        email: `drv2_${uniq}@test.com`,
        name: "기사2",
        phone: "010-5555-6666",
        userType: UserType.DRIVER
      }
    });
    const driver2 = await prisma.driver.create({
      data: {
        authUserId: d2Auth.id,
        nickname: `driver_two_${uniq}`,
        shortIntro: "짧은 소개 2",
        detailIntro: "상세 소개 2",
        moveType: [MoveType.SMALL],
        career: 3,
        work: 2
      }
    });
    driver2Id = driver2.id;

    // 3) 주소
    const fromA = await prisma.address.create({
      data: {
        postalCode: "03000",
        street: "세종대로 1",
        region: RegionType.SEOUL,
        district: "종로구"
      }
    });
    fromAddressId = fromA.id;

    const toA = await prisma.address.create({
      data: {
        postalCode: "10400",
        street: "일산로 2",
        region: RegionType.GYEONGGI,
        district: "고양시"
      }
    });
    toAddressId = toA.id;

    // 4) 견적요청
    const req = await prisma.estimateRequest.create({
      data: {
        customerId,
        moveType: MoveType.HOME,
        status: RequestStatus.PENDING,
        moveDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10), // +10일
        fromAddressId,
        toAddressId
      }
    });
    pendingRequestId = req.id;

    // 5) PROPOSED 견적
    const est1 = await prisma.estimate.create({
      data: {
        estimateRequestId: pendingRequestId,
        driverId: driver1Id,
        price: 2_222_222,
        comment: "빠르고 안전하게 모십니다",
        status: EstimateStatus.PROPOSED
      }
    });
    estimateByDriver1Id = est1.id;

    const est2 = await prisma.estimate.create({
      data: {
        estimateRequestId: pendingRequestId,
        driverId: driver2Id,
        price: 1_111_111,
        comment: "합리적인 가격 제시합니다",
        status: EstimateStatus.PROPOSED
      }
    });
    estimateByDriver2Id = est2.id;

    // 6) 토큰
    token = signAccessToken({ id: customerAuthUserId, userType: UserType.CUSTOMER, customerId });
  });

  afterAll(async () => {
    await resetDB();
    await prisma.$disconnect();
  });

  describe("GET /pending", () => {
    it("최신 PENDING 요청과 PROPOSED 견적 목록 반환", async () => {
      const res = await request(app)
        .get(`${BASE}/pending`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(res.body).toHaveProperty("estimateRequest");
      expect(res.body).toHaveProperty("estimates");
      expect(res.body.estimateRequest.id).toBe(pendingRequestId);
      expect(Array.isArray(res.body.estimates)).toBe(true);

      const ids = res.body.estimates.map((e: any) => e.id);
      expect(ids).toEqual(expect.arrayContaining([estimateByDriver1Id, estimateByDriver2Id]));
    });

    it("인증 없으면 401", async () => {
      await request(app).get(`${BASE}/pending`).expect(401);
    });
  });

  describe("PATCH /:estimateId/accept", () => {
    it("선택 견적 ACCEPTED, 나머지 AUTO_REJECTED, 요청 APPROVED", async () => {
      const target = estimateByDriver2Id;

      const res = await request(app)
        .patch(`${BASE}/${target}/accept`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(res.body).toHaveProperty("message", "견적이 성공적으로 확정되었습니다.");
      expect(res.body.data.estimateId).toBe(target);

      const accepted = await prisma.estimate.findUnique({ where: { id: target } });
      expect(accepted?.status).toBe(EstimateStatus.ACCEPTED);

      const other = await prisma.estimate.findUnique({ where: { id: estimateByDriver1Id } });
      expect(other?.status).toBe(EstimateStatus.AUTO_REJECTED);

      const reqAfter = await prisma.estimateRequest.findUnique({ where: { id: pendingRequestId } });
      expect(reqAfter?.status).toBe(RequestStatus.APPROVED);
    });
  });

  describe("GET /approve", () => {
    it("APPROVED/COMPLETED 요청의 견적 묶음 반환", async () => {
      const res = await request(app)
        .get(`${BASE}/approve`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(Array.isArray(res.body)).toBe(true);
      const group = res.body.find((g: any) => g.estimateRequest?.id === pendingRequestId);
      expect(group).toBeTruthy();

      const statuses = group.estimates.map((e: any) => e.status);
      expect(statuses).toEqual(expect.arrayContaining([EstimateStatus.ACCEPTED, EstimateStatus.AUTO_REJECTED]));
    });

    it("인증 없으면 401", async () => {
      await request(app).get(`${BASE}/approve`).expect(401);
    });
  });

  describe("GET /:estimateId", () => {
    it("견적 상세 조회", async () => {
      const anyEstimate = await prisma.estimate.findFirst({
        where: { estimateRequestId: pendingRequestId }
      });
      expect(anyEstimate).toBeTruthy();

      const res = await request(app)
        .get(`${BASE}/${anyEstimate!.id}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(res.body).toHaveProperty("id", anyEstimate!.id);
      expect(res.body).toHaveProperty("price");
      expect(res.body).toHaveProperty("status");
      expect(res.body).toHaveProperty("driver");
      expect(res.body).toHaveProperty("moveType");
      expect(res.body).toHaveProperty("fromAddress");
      expect(res.body).toHaveProperty("toAddress");
    });

    it("존재하지 않는 id → 404", async () => {
      await request(app)
        .get(`${BASE}/00000000-0000-0000-0000-000000000000`)
        .set("Authorization", `Bearer ${token}`)
        .expect(404);
    });
  });
});
