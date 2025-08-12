import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../app";
import { PrismaClient, EstimateStatus, RequestStatus, UserType, MoveType, RegionType } from "@prisma/client";
import { resetDB } from "../utils/resetDB";

const prisma = new PrismaClient();
const BASE = "/drivers";

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
  test("GET /drivers/:id", async () => {
    // Setup: driver 생성
    const dAuth = await prisma.authUser.create({
      data: {
        email: `driver1@test.com`,
        name: "기사1",
        phone: "010-3333-4444",
        userType: UserType.DRIVER
      }
    });
    const driver = await prisma.driver.create({
      data: {
        authUserId: dAuth.id,
        nickname: `driver_one`,
        shortIntro: "짧은 소개 1",
        detailIntro: "상세 소개 1",
        moveType: [MoveType.SMALL, MoveType.HOME],
        career: 5,
        work: 10
      }
    });

    // Exercise: 기사 정보
    const response = await request(app).get(`${BASE}/${driver.id}`).expect(200);

    // Assertion: 결과 검증
    expect(response.body.id).toBe(driver.id);
    expect(response.body.detailIntro).toBe("상세 소개 1");
    expect(response.body.shortIntro).toBe("짧은 소개 1");
  });
});
