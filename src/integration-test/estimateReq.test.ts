import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../app";
import prisma from "../config/prisma";
import { AddressRole, MoveType, RegionType, RequestStatus, UserType } from "@prisma/client";

const ADDRESS_BASE = "/customer/address";
const BASE = "/customer/estimate-request";

function signAccessToken(payload: { id: string; userType: UserType; customerId: string }) {
  const secret = process.env.JWT_SECRET || "test_secret";
  return jwt.sign(payload, secret, { expiresIn: "1h" });
}

describe("EstimateRequest 통합 테스트", () => {
  let token = "";
  let customerId = "";
  let fromAddressId = "";
  let toAddressId = "";
  let pendingRequestId = "";

  const uniq = Date.now();

  beforeAll(async () => {
    const { au, c } = await prisma.$transaction(async (tx) => {
      const au = await tx.authUser.create({
        data: {
          email: `cust_${uniq}@test.com`,
          name: "고객",
          phone: "010-0000-0000",
          userType: UserType.CUSTOMER
        }
      });
      const c = await tx.customer.create({
        data: { authUserId: au.id, moveType: [MoveType.HOME], currentArea: "서울 종로구" }
      });
      return { au, c };
    });
    customerId = c.id;
    token = signAccessToken({ id: au.id, userType: UserType.CUSTOMER, customerId });

    const from = await prisma.address.create({
      data: { postalCode: "03000", street: "세종대로 1", region: RegionType.SEOUL, district: "종로구" }
    });
    const to = await prisma.address.create({
      data: { postalCode: "10400", street: "일산로 2", region: RegionType.GYEONGGI, district: "고양시" }
    });
    fromAddressId = from.id;
    toAddressId = to.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("POST /customer/address - 고객 주소 연결", () => {
    beforeEach(async () => {
      await prisma.customerAddress.deleteMany();
    });

    it("고객 주소 연결 성공", async () => {
      const res = await request(app)
        .post(ADDRESS_BASE)
        .set("Authorization", `Bearer ${token}`)
        .send({
          addressId: fromAddressId,
          role: AddressRole.FROM
        })
        .expect(201)
        .expect("Content-Type", /json/);

      expect(res.body).toHaveProperty("id");
      expect(res.body).toMatchObject({
        customerId,
        addressId: fromAddressId,
        role: AddressRole.FROM
      });

      const saved = await prisma.customerAddress.findUnique({ where: { id: res.body.id } });
      expect(saved).toBeTruthy();
    });
  });

  describe("GET /customer/address?role=FROM - 고객 주소 조회", () => {
    beforeEach(async () => {
      await prisma.customerAddress.deleteMany();
      await prisma.customerAddress.create({
        data: { customerId, addressId: fromAddressId, role: AddressRole.FROM }
      });
      await prisma.customerAddress.create({
        data: { customerId, addressId: toAddressId, role: AddressRole.TO }
      });
    });

    it("역할별 주소 목록 조회 성공", async () => {
      const res = await request(app)
        .get(`${ADDRESS_BASE}?role=${AddressRole.FROM}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);

      const ids = res.body.map((r: any) => r.address?.id ?? r.addressId);
      expect(ids).toContain(fromAddressId);
      expect(ids).not.toContain(toAddressId);
    });
  });

  describe("POST /customer/estimate-request - 일반 견적 요청", () => {
    beforeEach(async () => {
      await prisma.estimate.deleteMany();
      await prisma.estimateRequest.deleteMany();
    });

    it("견적 요청 생성 성공", async () => {
      const moveDate = new Date(Date.now() + 7 * 86400000).toISOString();

      const res = await request(app)
        .post(BASE)
        .set("Authorization", `Bearer ${token}`)
        .send({
          moveType: MoveType.HOME,
          moveDate,
          fromAddressId,
          toAddressId
        })
        .expect(201)
        .expect("Content-Type", /json/);

      const body = res.body;
      expect(body).toMatchObject({
        customerId,
        moveType: MoveType.HOME,
        fromAddressId,
        toAddressId,
        status: RequestStatus.PENDING
      });

      const saved = await prisma.estimateRequest.findUnique({ where: { id: body.id } });
      expect(saved).toBeTruthy();

      pendingRequestId = body.id;
    });

    it("같은 주소면 400을 반환한다", async () => {
      const moveDate = new Date(Date.now() + 3 * 86400000).toISOString();

      await request(app)
        .post(BASE)
        .set("Authorization", `Bearer ${token}`)
        .send({
          moveType: MoveType.HOME,
          moveDate,
          fromAddressId: fromAddressId,
          toAddressId: fromAddressId
        })
        .expect(400);
    });

    it("과거 날짜면 400을 반환한다", async () => {
      const yesterday = new Date(Date.now() - 86400000).toISOString();

      await request(app)
        .post(BASE)
        .set("Authorization", `Bearer ${token}`)
        .send({
          moveType: MoveType.HOME,
          moveDate: yesterday,
          fromAddressId,
          toAddressId
        })
        .expect(400);
    });

    it("활성 요청이 이미 있으면 409를 반환한다", async () => {
      await prisma.estimateRequest.create({
        data: {
          customerId,
          moveType: MoveType.HOME,
          status: RequestStatus.PENDING,
          moveDate: new Date(Date.now() + 5 * 86400000),
          fromAddressId,
          toAddressId
        }
      });

      await request(app)
        .post(BASE)
        .set("Authorization", `Bearer ${token}`)
        .send({
          moveType: MoveType.HOME,
          moveDate: new Date(Date.now() + 7 * 86400000).toISOString(),
          fromAddressId,
          toAddressId
        })
        .expect(409);
    });
  });

  describe("GET /customer/estimate-request/active - 활성 견적 조회", () => {
    beforeEach(async () => {
      await prisma.estimate.deleteMany();
      await prisma.estimateRequest.deleteMany();

      const req = await prisma.estimateRequest.create({
        data: {
          customerId,
          moveType: MoveType.HOME,
          status: RequestStatus.PENDING,
          moveDate: new Date(Date.now() + 5 * 86400000),
          fromAddressId,
          toAddressId
        }
      });
      pendingRequestId = req.id;
    });

    it("최신 활성 요청 반환", async () => {
      const res = await request(app)
        .get(`${BASE}/active`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(res.body).toHaveProperty("id", pendingRequestId);
      expect(res.body).toHaveProperty("status", RequestStatus.PENDING);
    });
  });

  describe("POST /customer/estimate-request/designated - 지정 견적 요청", () => {
    let reqId = "";
    let driverId = "";

    beforeEach(async () => {
      await prisma.designatedDriver.deleteMany();
      await prisma.estimate.deleteMany();
      await prisma.estimateRequest.deleteMany();
      await prisma.driver.deleteMany();

      const req = await prisma.estimateRequest.create({
        data: {
          customerId,
          moveType: MoveType.HOME,
          status: RequestStatus.PENDING,
          moveDate: new Date(Date.now() + 10 * 86400000),
          fromAddressId,
          toAddressId
        }
      });
      reqId = req.id;

      const localUniq = Date.now();
      const { d } = await prisma.$transaction(async (tx) => {
        const dau = await tx.authUser.create({
          data: {
            email: `drv_${localUniq}@test.com`,
            name: "기사",
            phone: "010-9999-9999",
            userType: UserType.DRIVER
          }
        });
        const d = await tx.driver.create({
          data: {
            authUserId: dau.id,
            nickname: `driver_${localUniq}`,
            shortIntro: "intro",
            detailIntro: "detail",
            moveType: [MoveType.HOME],
            career: 1,
            work: 1
          }
        });
        return { d };
      });
      driverId = d.id;
    });

    it("지정 기사 생성 성공", async () => {
      const res = await request(app)
        .post(`${BASE}/designated`)
        .set("Authorization", `Bearer ${token}`)
        .send({ estimateRequestId: reqId, driverId })
        .expect(201)
        .expect("Content-Type", /json/);

      expect(res.body).toHaveProperty("message", "지정 견적 요청 완료");
      expect(res.body).toHaveProperty("data");
      expect(res.body.data).toHaveProperty("id");

      const count = await prisma.designatedDriver.count({
        where: { estimateRequestId: reqId }
      });
      expect(count).toBe(1);
    });

    it("driverId 누락 시 400을 반환한다", async () => {
      await request(app)
        .post(`${BASE}/designated`)
        .set("Authorization", `Bearer ${token}`)
        .send({ estimateRequestId: reqId })
        .expect(400);
    });

    it("이미 지정된 기사를 다시 지정하면 409를 반환한다", async () => {
      await request(app)
        .post(`${BASE}/designated`)
        .set("Authorization", `Bearer ${token}`)
        .send({ estimateRequestId: reqId, driverId })
        .expect(201);

      // 동일 기사 재지정
      await request(app)
        .post(`${BASE}/designated`)
        .set("Authorization", `Bearer ${token}`)
        .send({ estimateRequestId: reqId, driverId })
        .expect(409);
    });

    it("지정 기사가 3명을 초과하면 409를 반환한다", async () => {
      const uniqA = Date.now();
      const uniqB = uniqA + 1;

      const makeDriver = async (suffix: number) => {
        const { d } = await prisma.$transaction(async (tx) => {
          const au = await tx.authUser.create({
            data: {
              email: `drv_extra_${suffix}@test.com`,
              name: `기사${suffix}`,
              phone: `010-8${suffix}`,
              userType: UserType.DRIVER
            }
          });
          const d = await tx.driver.create({
            data: {
              authUserId: au.id,
              nickname: `driver_extra_${suffix}`,
              shortIntro: "intro",
              detailIntro: "detail",
              moveType: [MoveType.HOME],
              career: 1,
              work: 1
            }
          });
          return { d };
        });
        return d.id;
      };

      const driverId2 = await makeDriver(uniqA);
      const driverId3 = await makeDriver(uniqB);

      await request(app)
        .post(`${BASE}/designated`)
        .set("Authorization", `Bearer ${token}`)
        .send({ estimateRequestId: reqId, driverId })
        .expect(201);

      await request(app)
        .post(`${BASE}/designated`)
        .set("Authorization", `Bearer ${token}`)
        .send({ estimateRequestId: reqId, driverId: driverId2 })
        .expect(201);

      await request(app)
        .post(`${BASE}/designated`)
        .set("Authorization", `Bearer ${token}`)
        .send({ estimateRequestId: reqId, driverId: driverId3 })
        .expect(201);

      // 4번째 지정
      const driverId4 = await makeDriver(uniqB + 1);
      await request(app)
        .post(`${BASE}/designated`)
        .set("Authorization", `Bearer ${token}`)
        .send({ estimateRequestId: reqId, driverId: driverId4 })
        .expect(409);
    });
  });
});
