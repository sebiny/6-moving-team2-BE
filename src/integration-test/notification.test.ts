import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../app";
import { PrismaClient, UserType, MoveType, NotificationType } from "@prisma/client";
import { resetDB } from "../utils/resetDB";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();
const BASE = "/notification";

// JWT 도우미
function signAccessToken(payload: { id: string; userType: UserType; customerId: string; customerName: string }) {
  const secret = process.env.JWT_SECRET || "test_secret";
  return jwt.sign(payload, secret, { expiresIn: "1h" });
}

// 테스트용 알림 생성 헬퍼
const createTestNotification = async (senderId: string, receiverId: string) => {
  return await prisma.notification.create({
    data: {
      message: "테스트 알림입니다.",
      type: NotificationType.WELCOME,
      isRead: false,
      path: "",
      senderId,
      receiverId
    }
  });
};

describe("알림 API 테스트", () => {
  // 고객/토큰
  let customerAuthUserId = "";
  let customerId = "";
  let customerName = "";
  let token = "";

  const uniq = randomUUID();

  beforeAll(async () => {
    // 데이터베이스 연결 테스트
    try {
      await prisma.$connect();
      console.log("Database connected successfully");
    } catch (error) {
      console.error("Database connection failed:", error);
      throw error;
    }

    await resetDB();
    // 고객
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
        moveType: [MoveType.SMALL],
        currentArea: "서울시 종로구"
      }
    });
    customerId = customer.id;

    // 토큰
    token = signAccessToken({
      id: customerAuthUserId,
      userType: UserType.CUSTOMER,
      customerId,
      customerName: customerAuth.name
    });
  });

  afterAll(async () => {
    await resetDB();
    await prisma.$disconnect();
  });

  describe("GET /notification", () => {
    beforeEach(async () => {
      // 테스트용 알림들 생성
      await createTestNotification(customerAuthUserId, customerAuthUserId); // 시스템 알림

      // 회원가입 환영 알림 직접 생성
      await prisma.notification.create({
        data: {
          message: `${customerName}님, 회원가입을 환영합니다!`,
          type: NotificationType.WELCOME,
          isRead: false,
          path: "",
          senderId: customerAuthUserId,
          receiverId: customerAuthUserId
        }
      });
    });

    it("사용자의 모든 알림을 조회해야 함", async () => {
      const res = await request(app).get(`${BASE}`).set("Authorization", `Bearer ${token}`).expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);

      // 최신순 정렬 확인
      for (let i = 0; i < res.body.length - 1; i++) {
        const current = new Date(res.body[i].createdAt);
        const next = new Date(res.body[i + 1].createdAt);
        expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
      }

      // 모든 알림이 해당 사용자의 것인지 확인
      res.body.forEach((notification: any) => {
        expect(notification.receiverId).toBe(customerAuthUserId);
      });
    });
  });
});
