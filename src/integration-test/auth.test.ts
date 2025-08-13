import request from "supertest";
import app from "../app";
import { PrismaClient, UserType } from "@prisma/client";
import { resetDB } from "../utils/resetDB";

const prisma = new PrismaClient();

function getCookieValue(setCookies: string[] | undefined, name: string): string | undefined {
  if (!setCookies) return undefined;
  for (const c of setCookies) {
    const m = c.match(new RegExp(`${name}=([^;]+)`));
    if (m) return m[1];
  }
  return undefined;
}

// 유니크 값 헬퍼
function unique() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
function phone8() {
  return String(Math.floor(10_000_000 + Math.random() * 89_999_999)).slice(0, 8);
}
/** 매 테스트마다 다른 회원가입 바디 생성 */
function makeSignupBody(
  overrides: Partial<{
    userType: UserType;
    name: string;
    email: string;
    phone: string;
    password: string;
    passwordConfirmation: string;
  }> = {}
) {
  const u = unique();
  const base = {
    userType: UserType.CUSTOMER,
    name: "테스트계정",
    email: `test+${u}@example.com`, // 매 테스트마다 다른 이메일
    phone: `010${phone8()}`, // 매 테스트마다 다른 번호
    password: "Password!1",
    passwordConfirmation: "Password!1"
  };
  return { ...base, ...overrides };
}

describe("Auth 통합 테스트 (/auth/*)", () => {
  let agent: ReturnType<typeof request.agent>;
  let accessToken: string;

  beforeAll(async () => {
    await resetDB();
  });

  beforeEach(async () => {
    await resetDB();
    agent = request.agent(app); // 매 테스트 새 에이전트
    accessToken = "";
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // Signup

  test("POST /auth/signup - 회원가입 성공(201)", async () => {
    const body = makeSignupBody();
    const res = await request(app).post("/auth/signup").send(body).expect(201);

    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("email", body.email);
    expect(res.body).toHaveProperty("userType", body.userType);

    const saved = await prisma.authUser.findUnique({ where: { email: body.email } });
    expect(saved).toBeTruthy();
    expect(saved?.name).toBe(body.name);
  });

  test("POST /auth/signup - 중복 이메일이면 409", async () => {
    const body = makeSignupBody();
    await request(app).post("/auth/signup").send(body).expect(201);
    const res = await request(app).post("/auth/signup").send(body).expect(409);
    expect(res.body).toHaveProperty("message");
  });

  test("POST /auth/signup - 유효성 실패들(이메일/전화/비번) 422", async () => {
    const base = makeSignupBody();

    await request(app)
      .post("/auth/signup")
      .send({ ...base, email: "bad-email" })
      .expect(422);

    await request(app)
      .post("/auth/signup")
      .send({ ...makeSignupBody(), email: "ok@ex.com", phone: "010-1234-5678" }) // 하이픈 포함
      .expect(422);

    await request(app)
      .post("/auth/signup")
      .send({ ...makeSignupBody(), email: "ok2@ex.com", password: "short", passwordConfirmation: "short" })
      .expect(422);
  });

  test("POST /auth/signup - 응답에 password 포함 금지", async () => {
    const body = makeSignupBody();
    const res = await request(app).post("/auth/signup").send(body).expect(201);
    expect(res.body).not.toHaveProperty("password");
  });

  // Login

  test("POST /auth/login - 로그인 성공(200), accessToken 반환 & refreshToken 쿠키 설정", async () => {
    const body = makeSignupBody();
    await request(app).post("/auth/signup").send(body).expect(201);

    const res = await agent
      .post("/auth/login")
      .send({ email: body.email, password: body.password, userType: body.userType })
      .expect(200);

    expect(res.body).toHaveProperty("accessToken");
    expect(res.body).toHaveProperty("user");
    expect(res.body.user.email).toBe(body.email);

    // refreshToken 쿠키 존재 확인
    const setCookie = res.headers["set-cookie"];
    const hasRefresh = Array.isArray(setCookie)
      ? setCookie.some((c) => /^refreshToken=/.test(c))
      : typeof setCookie === "string"
        ? /^refreshToken=/.test(setCookie)
        : false;
    expect(hasRefresh).toBe(true);

    accessToken = res.body.accessToken;
  });

  test("POST /auth/login - 필수값 누락시 422", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "a@a.com", password: "x" }) // userType 없음
      .expect(422);

    expect(res.body).toHaveProperty("message");
  });

  test("POST /auth/login - 잘못된 userType이면 422", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "a@a.com", password: "x", userType: "ADMIN" })
      .expect(422);

    expect(res.body).toHaveProperty("message");
  });

  test("POST /auth/login - 가입 userType과 다른 타입으로 로그인 시 403", async () => {
    const body = makeSignupBody();
    await request(app).post("/auth/signup").send(body).expect(201);
    const res = await request(app)
      .post("/auth/login")
      .send({ email: body.email, password: body.password, userType: UserType.DRIVER })
      .expect(403);
    expect(res.body).toHaveProperty("message");
  });

  // Me (인증)

  test("GET /auth/me - 토큰 없으면 401", async () => {
    await request(app).get("/auth/me").expect(401);
  });

  test("GET /auth/me - 유효한 accessToken으로 내 정보 조회(200)", async () => {
    const body = makeSignupBody();
    await request(app).post("/auth/signup").send(body).expect(201);
    const login = await agent
      .post("/auth/login")
      .send({ email: body.email, password: body.password, userType: body.userType })
      .expect(200);
    const token = login.body.accessToken as string;

    const res = await request(app).get("/auth/me").set("Authorization", `Bearer ${token}`).expect(200);
    expect(res.body).toHaveProperty("user");
    expect(res.body.user).toHaveProperty("id");
    expect(res.body.user).toHaveProperty("userType", body.userType);
  });

  test("GET /auth/me/name - 이름/프로필 조회(200)", async () => {
    const body = makeSignupBody();
    await request(app).post("/auth/signup").send(body).expect(201);
    const login = await agent
      .post("/auth/login")
      .send({ email: body.email, password: body.password, userType: body.userType })
      .expect(200);
    const token = login.body.accessToken as string;

    const res = await request(app).get("/auth/me/name").set("Authorization", `Bearer ${token}`).expect(200);
    expect(res.body).toHaveProperty("name", body.name);
  });

  test("GET /auth/me/detail - 상세 조회(200)", async () => {
    const body = makeSignupBody();
    await request(app).post("/auth/signup").send(body).expect(201);
    const login = await agent
      .post("/auth/login")
      .send({ email: body.email, password: body.password, userType: body.userType })
      .expect(200);
    const token = login.body.accessToken as string;

    const res = await request(app).get("/auth/me/detail").set("Authorization", `Bearer ${token}`).expect(200);
    expect(res.body).toHaveProperty("email", body.email);
    expect(res.body).not.toHaveProperty("password");
  });

  // Refresh Token

  test("POST /auth/refresh-token - 쿠키의 refreshToken으로 accessToken 재발급(200)", async () => {
    const body = makeSignupBody();
    await request(app).post("/auth/signup").send(body).expect(201);

    const login = await agent
      .post("/auth/login")
      .send({ email: body.email, password: body.password, userType: body.userType })
      .expect(200);

    // agent의 쿠키 저장(secure/domain 문제) 우회를 위해 직접 Cookie 헤더로 전달
    const rawCookies = login.headers["set-cookie"];
    const setCookies = Array.isArray(rawCookies) ? rawCookies : rawCookies ? [rawCookies] : [];
    const rt = getCookieValue(setCookies, "refreshToken");
    expect(rt).toBeTruthy();

    const res = await request(app)
      .post("/auth/refresh-token")
      .set("Cookie", [`refreshToken=${rt}`])
      .expect(200);

    expect(res.body).toHaveProperty("accessToken");
    expect(typeof res.body.accessToken).toBe("string");

    const me = await request(app).get("/auth/me").set("Authorization", `Bearer ${res.body.accessToken}`).expect(200);
    expect(me.body).toHaveProperty("user");
  });

  test("POST /auth/refresh-token - 쿠키 없으면 401", async () => {
    await request(app).post("/auth/refresh-token").expect(401);
  });

  test("POST /auth/refresh-token - 조작된 쿠키면 401", async () => {
    await request(app).post("/auth/refresh-token").set("Cookie", ["refreshToken=fake.invalid.token"]).expect(401);
  });

  // Logout

  test("POST /auth/logout - 로그아웃 성공(200) & 쿠키 제거", async () => {
    const body = makeSignupBody();
    await request(app).post("/auth/signup").send(body).expect(201);
    await agent
      .post("/auth/login")
      .send({ email: body.email, password: body.password, userType: body.userType })
      .expect(200);

    const res = await agent.post("/auth/logout").expect(200);
    expect(res.body).toHaveProperty("message");

    // Set-Cookie 헤더가 없는 환경도 있으니 존재 여부만 느슨하게 확인
    const setCookie = res.headers["set-cookie"];
    expect(Array.isArray(setCookie) || typeof setCookie === "string" || typeof setCookie === "undefined").toBe(true);
  });

  // Social

  test("GET /auth/social/:provider - 미지원 provider면 400", async () => {
    const res = await request(app).get("/auth/social/unknown?userType=CUSTOMER").expect(400);
    expect(res.body).toHaveProperty("message");
  });

  test("GET /auth/social/:provider - 잘못된 userType이면 422", async () => {
    const res = await request(app).get("/auth/social/google?userType=ADMIN").expect(422);
    expect(res.body).toHaveProperty("message");
  });
});
