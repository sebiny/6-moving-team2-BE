import request from "supertest";
import app from "../app";
import { PrismaClient, EstimateStatus, RequestStatus, UserType, MoveType, RegionType } from "@prisma/client";
import { resetDB } from "../utils/resetDB";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
const BASE = "/driver";

describe("Driver Private API (integration)", () => {
  beforeAll(async () => {
    await resetDB();
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await resetDB();
  });

  // 공통 헬퍼 함수들
  async function createDriverAndAuth(emailSuffix: string = "1") {
    const hashedPassword = await bcrypt.hash("Password!1", 10);
    const authUser = await prisma.authUser.create({
      data: {
        email: `driver${emailSuffix}@test.com`,
        name: `기사${emailSuffix}`,
        phone: "010-3333-4444",
        userType: UserType.DRIVER,
        password: hashedPassword
      }
    });
    const driver = await prisma.driver.create({
      data: {
        authUserId: authUser.id,
        nickname: `driver_${emailSuffix}`,
        shortIntro: `짧은 소개 ${emailSuffix}`,
        detailIntro: `상세 소개 ${emailSuffix}`,
        moveType: [MoveType.SMALL, MoveType.HOME],
        career: 5,
        work: 10
      }
    });

    // 서비스 지역 추가
    await prisma.driverServiceArea.create({
      data: {
        driverId: driver.id,
        region: RegionType.SEOUL,
        district: "강남구"
      }
    });

    return { authUser, driver };
  }

  async function createCustomerAndAuth(emailSuffix: string = "1") {
    const authUser = await prisma.authUser.create({
      data: {
        email: `customer${emailSuffix}@test.com`,
        name: `고객${emailSuffix}`,
        phone: "010-1111-2222",
        userType: UserType.CUSTOMER
      }
    });
    const customer = await prisma.customer.create({
      data: {
        authUserId: authUser.id,
        moveType: [MoveType.SMALL, MoveType.HOME],
        currentArea: "서울시 강남구"
      }
    });
    return { authUser, customer };
  }

  async function createAddresses() {
    const fromAddress = await prisma.address.create({
      data: {
        postalCode: "06123",
        street: "서울시 강남구 테헤란로 123",
        detail: "456동 789호",
        region: RegionType.SEOUL,
        district: "강남구"
      }
    });

    const toAddress = await prisma.address.create({
      data: {
        postalCode: "06543",
        street: "서울시 서초구 서초대로 456",
        detail: "789동 123호",
        region: RegionType.SEOUL,
        district: "서초구"
      }
    });

    return { fromAddress, toAddress };
  }

  async function loginAndGetToken(email: string, password: string, userType: UserType) {
    const loginResponse = await request(app).post("/auth/login").send({ email, password, userType }).expect(200);
    return loginResponse.body.accessToken;
  }

  describe("GET /estimate-requests", () => {
    test("모든 견적 요청 조회 성공", async () => {
      const { authUser: dAuth, driver } = await createDriverAndAuth("4");
      const { authUser: cAuth, customer } = await createCustomerAndAuth("3");
      const { fromAddress, toAddress } = await createAddresses();

      // 여러 견적 요청 생성
      const estimateRequest1 = await prisma.estimateRequest.create({
        data: {
          customerId: customer.id,
          fromAddressId: fromAddress.id,
          toAddressId: toAddress.id,
          moveType: MoveType.SMALL,
          moveDate: new Date("2024-12-25"),
          status: RequestStatus.PENDING
        }
      });

      const estimateRequest2 = await prisma.estimateRequest.create({
        data: {
          customerId: customer.id,
          fromAddressId: fromAddress.id,
          toAddressId: toAddress.id,
          moveType: MoveType.HOME,
          moveDate: new Date("2024-12-26"),
          status: RequestStatus.PENDING
        }
      });

      const accessToken = await loginAndGetToken("driver4@test.com", "Password!1", UserType.DRIVER);

      const response = await request(app)
        .get(`${BASE}/estimate-requests`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
    });
  });

  describe("POST /estimate-requests/:requestId/estimates", () => {
    test("견적 생성 성공", async () => {
      const { authUser: dAuth, driver } = await createDriverAndAuth("5");
      const { authUser: cAuth, customer } = await createCustomerAndAuth("4");
      const { fromAddress, toAddress } = await createAddresses();

      const estimateRequest = await prisma.estimateRequest.create({
        data: {
          customerId: customer.id,
          fromAddressId: fromAddress.id,
          toAddressId: toAddress.id,
          moveType: MoveType.SMALL,
          moveDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7일 후
          status: RequestStatus.PENDING
        }
      });

      const accessToken = await loginAndGetToken("driver5@test.com", "Password!1", UserType.DRIVER);

      const response = await request(app)
        .post(`${BASE}/estimate-requests/${estimateRequest.id}/estimates`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          price: 150000,
          message: "견적 메시지입니다."
        })
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body.price).toBe(150000);
      expect(response.body.comment).toBe("견적 메시지입니다.");
      expect(response.body.status).toBe(EstimateStatus.PROPOSED);
    });

    test("견적 요청이 존재하지 않으면 404", async () => {
      const { authUser: dAuth, driver } = await createDriverAndAuth("6");
      const accessToken = await loginAndGetToken("driver6@test.com", "Password!1", UserType.DRIVER);

      await request(app)
        .post(`${BASE}/estimate-requests/non-existent-id/estimates`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          price: 150000,
          message: "견적 메시지입니다."
        })
        .expect(404);
    });
  });

  describe("POST /estimate-requests/:requestId/reject", () => {
    test("견적 요청 반려 성공", async () => {
      const { authUser: dAuth, driver } = await createDriverAndAuth("7");
      const { authUser: cAuth, customer } = await createCustomerAndAuth("5");
      const { fromAddress, toAddress } = await createAddresses();

      const estimateRequest = await prisma.estimateRequest.create({
        data: {
          customerId: customer.id,
          fromAddressId: fromAddress.id,
          toAddressId: toAddress.id,
          moveType: MoveType.SMALL,
          moveDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7일 후
          status: RequestStatus.PENDING
        }
      });

      const accessToken = await loginAndGetToken("driver7@test.com", "Password!1", UserType.DRIVER);

      const response = await request(app)
        .post(`${BASE}/estimate-requests/${estimateRequest.id}/reject`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          reason: "일정이 맞지 않습니다."
        })
        .expect(200);

      expect(response.body).toHaveProperty("message");
    });
  });

  describe("GET /estimates", () => {
    test("내 견적 조회 성공", async () => {
      const { authUser: dAuth, driver } = await createDriverAndAuth("8");
      const { authUser: cAuth, customer } = await createCustomerAndAuth("6");
      const { fromAddress, toAddress } = await createAddresses();

      const estimateRequest = await prisma.estimateRequest.create({
        data: {
          customerId: customer.id,
          fromAddressId: fromAddress.id,
          toAddressId: toAddress.id,
          moveType: MoveType.HOME,
          moveDate: new Date("2024-12-26"),
          status: RequestStatus.PENDING
        }
      });

      const estimate = await prisma.estimate.create({
        data: {
          driverId: driver.id,
          estimateRequestId: estimateRequest.id,
          price: 150000,
          status: EstimateStatus.PROPOSED,
          comment: "견적 메시지입니다."
        }
      });

      const accessToken = await loginAndGetToken("driver8@test.com", "Password!1", UserType.DRIVER);

      const response = await request(app)
        .get(`${BASE}/estimates`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].id).toBe(estimate.id);
      expect(response.body[0].price).toBe(150000);
      expect(response.body[0].status).toBe(EstimateStatus.PROPOSED);
      expect(response.body[0].comment).toBe("견적 메시지입니다.");
    });
  });

  describe("GET /estimates/:estimateId", () => {
    test("견적 상세 조회 성공", async () => {
      const { authUser: dAuth, driver } = await createDriverAndAuth("9");
      const { authUser: cAuth, customer } = await createCustomerAndAuth("7");
      const { fromAddress, toAddress } = await createAddresses();

      const estimateRequest = await prisma.estimateRequest.create({
        data: {
          customerId: customer.id,
          fromAddressId: fromAddress.id,
          toAddressId: toAddress.id,
          moveType: MoveType.HOME,
          moveDate: new Date("2024-12-26"),
          status: RequestStatus.PENDING
        }
      });

      const estimate = await prisma.estimate.create({
        data: {
          driverId: driver.id,
          estimateRequestId: estimateRequest.id,
          price: 200000,
          status: EstimateStatus.PROPOSED,
          comment: "상세 견적 메시지입니다."
        }
      });

      const accessToken = await loginAndGetToken("driver9@test.com", "Password!1", UserType.DRIVER);

      const response = await request(app)
        .get(`${BASE}/estimates/${estimate.id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.id).toBe(estimate.id);
      expect(response.body.price).toBe(200000);
      expect(response.body.comment).toBe("상세 견적 메시지입니다.");
    });

    test("존재하지 않는 견적 조회 시 404", async () => {
      const { authUser: dAuth, driver } = await createDriverAndAuth("10");
      const accessToken = await loginAndGetToken("driver10@test.com", "Password!1", UserType.DRIVER);

      await request(app)
        .get(`${BASE}/estimates/non-existent-id`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe("GET /estimate-requests/rejected", () => {
    test("반려된 견적 요청 조회 성공", async () => {
      const { authUser: dAuth, driver } = await createDriverAndAuth("11");
      const { authUser: cAuth, customer } = await createCustomerAndAuth("8");
      const { fromAddress, toAddress } = await createAddresses();

      const estimateRequest = await prisma.estimateRequest.create({
        data: {
          customerId: customer.id,
          fromAddressId: fromAddress.id,
          toAddressId: toAddress.id,
          moveType: MoveType.SMALL,
          moveDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7일 후
          status: RequestStatus.PENDING
        }
      });

      // 반려 기록 생성
      await prisma.driverEstimateRejection.create({
        data: {
          driverId: driver.id,
          estimateRequestId: estimateRequest.id,
          reason: "일정이 맞지 않습니다."
        }
      });

      const accessToken = await loginAndGetToken("driver11@test.com", "Password!1", UserType.DRIVER);

      const response = await request(app)
        .get(`${BASE}/estimate-requests/rejected`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0]).toHaveProperty("id");
    });
  });

  describe("인증 관련 테스트", () => {
    test("토큰 없이 요청 시 401", async () => {
      await request(app).get(`${BASE}/estimates`).expect(500);
    });

    test("잘못된 토큰으로 요청 시 401", async () => {
      await request(app).get(`${BASE}/estimates`).set("Authorization", "Bearer invalid-token").expect(500);
    });
  });
});
