import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../../src/app"; // 실제 app 경로 맞춰주세요
import { PrismaClient, UserType, RegionType, MoveType } from "@prisma/client";
import { resetDB } from "../utils/resetDB";

const prisma = new PrismaClient();
const BASE = "/reviews/review/mine";
function signAccessToken(payload: { id: string; userType: UserType; customerId: string }) {
  const secret = process.env.JWT_SECRET || "test_secret";
  return jwt.sign(payload, secret, { expiresIn: "1h" });
}

describe("Customer Review API (integration)", () => {
  let token = "";
  let customerId = "";
  let estimateRequestId = "";
  let reviewId = "";

  beforeAll(async () => {
    await resetDB();

    // 1. 고객 유저 생성
    const authUser = await prisma.authUser.create({
      data: {
        email: `cust_${Date.now()}@test.com`,
        name: "고객A",
        phone: "010-1111-2222",
        userType: UserType.CUSTOMER
      }
    });

    const customer = await prisma.customer.create({
      data: {
        authUserId: authUser.id,
        moveType: [],
        currentArea: "서울시 종로구"
      }
    });
    customerId = customer.id;

    // 2. 드라이버 생성
    const driverAuth = await prisma.authUser.create({
      data: {
        email: `driver_${Date.now()}@test.com`,
        name: "드라이버A",
        phone: "010-9999-8888",
        userType: UserType.DRIVER
      }
    });
    const driver = await prisma.driver.create({
      data: {
        authUserId: driverAuth.id,
        nickname: "드라이버닉",
        shortIntro: "안녕하세요 드라이버입니다.",
        detailIntro: "경력 5년의 이사 전문가입니다.",
        career: 5
      }
    });
    //3. 주소 생성
    const fromAddress = await prisma.address.create({
      data: {
        postalCode: "03000",
        street: "세종대로 1",
        region: RegionType.SEOUL,
        district: "종로구"
      }
    });

    const toAddress = await prisma.address.create({
      data: {
        postalCode: "10400",
        street: "일산로 2",
        region: RegionType.GYEONGGI,
        district: "고양시"
      }
    });

    // 4. 완료된 견적 요청 + 수락된 견적 생성
    const estimateReq = await prisma.estimateRequest.create({
      data: {
        customerId,
        moveType: MoveType.HOME, //enum 단일 값
        status: "COMPLETED",
        moveDate: new Date(),
        fromAddressId: fromAddress.id,
        toAddressId: toAddress.id,
        estimates: {
          create: {
            driverId: driver.id,
            status: "ACCEPTED",
            price: 20000,
            isDesignated: false
          }
        }
      },
      include: { estimates: true }
    });

    estimateRequestId = estimateReq.id;

    token = signAccessToken({ id: authUser.id, userType: UserType.CUSTOMER, customerId });
  });

  afterAll(async () => {
    await resetDB();
    await prisma.$disconnect(); //DB 연결을 종료해서 리소스 정리.
  });

  describe("POST /", () => {
    it("리뷰 작성 성공", async () => {
      const res = await request(app)
        .post(BASE)
        .set("Authorization", `Bearer ${token}`)
        .send({
          estimateRequestId,
          driverId: (await prisma.estimate.findFirst({ where: { estimateRequestId } }))!.driverId,
          customerId,
          rating: 5,
          content: "정말 친절하고 깔끔했어요!"
        })
        .expect(201);

      expect(res.body).toHaveProperty("id");
      reviewId = res.body.id;
    });
  });

  describe("GET /me", () => {
    it("내 리뷰 목록 조회 성공", async () => {
      const res = await request(app).get(`${BASE}/me?page=1`).set("Authorization", `Bearer ${token}`).expect(200);

      expect(res.body).toHaveProperty("reviews");
      expect(res.body.reviews.length).toBeGreaterThan(0);
    });
  });

  describe("DELETE /:reviewId", () => {
    it("리뷰 삭제 성공", async () => {
      const res = await request(app).delete(`${BASE}/${reviewId}`).set("Authorization", `Bearer ${token}`).expect(200);

      expect(res.body).toHaveProperty("message");
      const deleted = await prisma.review.findUnique({ where: { id: reviewId } });
      expect(deleted?.deletedAt).not.toBeNull();
    });
  });
});
