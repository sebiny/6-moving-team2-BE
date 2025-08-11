import request from "supertest";
import app from "../app";
import prisma from "../config/prisma";

describe("POST /login - 로그인 API 테스트", () => {
  // 로그인 테스트 전후로 데이터베이스 정리
  beforeAll(async () => {
    await prisma.driver.deleteMany();
    await prisma.authUser.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // 각 테스트 전에 사용자 데이터 정리 (테스트 격리)
    await prisma.driver.deleteMany();
    await prisma.authUser.deleteMany();
  });

  test("올바른 이메일과 비밀번호로 로그인할 수 있어야 한다", async () => {
    // Setup 1: API를 통해 테스트 사용자 생성
    const createAuthUserrResponse = await request(app)
      .post("/users")
      .send({
        email: "test@example.com",
        name: "테스트 사용자"
      })
      .expect(201);

    // Setup 2: Driver 생성

    // Exercise: 로그인 요청
    const response = await request(app)
      .post("/login")
      .send({
        email: "test@example.com",
        password: "password123"
      })
      .expect(200);

    // Assertion: 결과 검증
    expect(response.body).toHaveProperty("message", "로그인 성공");
    expect(response.body).toHaveProperty("token");
    expect(response.body).toHaveProperty("user");
    expect(response.body.user.email).toBe("test@example.com");
    expect(response.body.user.name).toBe("테스트 사용자");
  });

  test("존재하지 않는 이메일로 로그인 시 401 에러를 반환해야 한다", async () => {
    // Exercise: 로그인 요청
    const response = await request(app)
      .post("/login")
      .send({
        email: "nonexistent@example.com",
        password: "password123"
      })
      .expect(401);

    // Assertion: 결과 검증
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toContain("이메일 또는 비밀번호");
  });

  test("잘못된 비밀번호로 로그인 시 401 에러를 반환해야 한다", async () => {
    // Setup: API를 통해 테스트 사용자 생성
    await request(app)
      .post("/users")
      .send({
        email: "test@example.com",
        name: "테스트 사용자"
      })
      .expect(201);

    // Exercise: 로그인 요청
    const response = await request(app)
      .post("/login")
      .send({
        email: "test@example.com",
        password: "wrongpassword"
      })
      .expect(401);

    // Assertion: 결과 검증
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toContain("이메일 또는 비밀번호");
  });

  test("잘못된 이메일 형식으로 로그인 시 400 에러를 반환해야 한다", async () => {
    // Exercise: 로그인 요청
    const response = await request(app)
      .post("/login")
      .send({
        email: "invalid-email",
        password: "password123"
      })
      .expect(400);

    // Assertion: 결과 검증
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toContain("이메일 형식");
  });

  test("비밀번호가 너무 짧으면 400 에러를 반환해야 한다", async () => {
    // Exercise: 로그인 요청
    const response = await request(app)
      .post("/login")
      .send({
        email: "test@example.com",
        password: "123"
      })
      .expect(400);

    // Assertion: 결과 검증
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toContain("비밀번호는 최소 6자");
  });
});
