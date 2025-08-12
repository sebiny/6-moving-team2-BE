import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../app";
import { PrismaClient, UserType, MoveType } from "@prisma/client";
import { resetDB } from "../utils/resetDB";

const prisma = new PrismaClient();
const BASE = "/favorite";

function signAccessToken(payload: { id: string; userType: UserType; customerId: string }) {
  const secret = process.env.JWT_SECRET || "test_secret";
  return jwt.sign(payload, secret, { expiresIn: "1h" });
}

// 테스트용 유저와 드라이버 생성 헬퍼 함수
async function createDriverAndAuth(emailSuffix: string = "1") {
  const authUser = await prisma.authUser.create({
    data: {
      email: `driver${emailSuffix}@test.com`,
      name: `기사${emailSuffix}`,
      phone: "010-3333-4444",
      userType: UserType.DRIVER
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
  return { authUser, driver };
}

async function createCustomerAndAuth(emailSuffix: string = "1", driverAuthId?: string) {
  const authUser = await prisma.authUser.create({
    data: {
      email: `customer${emailSuffix}@test.com`,
      name: `고객${emailSuffix}`,
      phone: "010-3333-4444",
      userType: UserType.CUSTOMER
    }
  });
  const customer = await prisma.customer.create({
    data: {
      authUserId: driverAuthId || authUser.id, // 필요 시 외부 authUserId 주입 가능
      moveType: [MoveType.SMALL, MoveType.HOME],
      currentArea: "SEOUL"
    }
  });
  return { authUser, customer };
}

describe("Driver API (integration)", () => {
  beforeAll(async () => {
    await resetDB();
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await resetDB();
  });

  test("POST /favorite/drivers/:id - 찜하기 생성", async () => {
    const { authUser: dAuth, driver } = await createDriverAndAuth("1");
    const { authUser: cAuth, customer } = await createCustomerAndAuth("1", dAuth.id);

    const token = signAccessToken({ id: cAuth.id, userType: UserType.CUSTOMER, customerId: customer.id });

    const response = await request(app)
      .post(`${BASE}/drivers/${driver.id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(201);

    expect(response.body.customerId).toBe(customer.id);
    expect(response.body.driverId).toBe(driver.id);
  });

  test("DELETE /favorite/drivers/:id - 찜하기 삭제", async () => {
    const { authUser: dAuth, driver } = await createDriverAndAuth("2");
    const { authUser: cAuth, customer } = await createCustomerAndAuth("2", dAuth.id);

    await prisma.favorite.create({
      data: {
        customerId: customer.id,
        driverId: driver.id
      }
    });

    const token = signAccessToken({ id: cAuth.id, userType: UserType.CUSTOMER, customerId: customer.id });

    await request(app).delete(`${BASE}/drivers/${driver.id}`).set("Authorization", `Bearer ${token}`).expect(204);
  });

  test("GET /favorite - 찜한 기사 조회", async () => {
    const { authUser: dAuth, driver } = await createDriverAndAuth("3");
    const { authUser: cAuth, customer } = await createCustomerAndAuth("3", dAuth.id);

    await prisma.favorite.create({
      data: {
        customerId: customer.id,
        driverId: driver.id
      }
    });

    const token = signAccessToken({ id: cAuth.id, userType: UserType.CUSTOMER, customerId: customer.id });

    const response = await request(app).get(BASE).set("Authorization", `Bearer ${token}`).expect(200);

    expect(response.body[0].id).toBe(driver.id);
  });
});
