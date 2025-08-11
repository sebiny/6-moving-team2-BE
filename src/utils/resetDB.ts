import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function resetDB() {
  // 1) 알림 등 최상단 의존
  await prisma.notification?.deleteMany().catch(() => {});

  // 2) 좋아요/리뷰 등 하위 의존
  await prisma.favorite?.deleteMany().catch(() => {});
  await prisma.review?.deleteMany().catch(() => {});
  await prisma.driverEstimateRejection?.deleteMany?.().catch(() => {});

  // 3) 견적 관련
  await prisma.designatedDriver?.deleteMany().catch(() => {});
  await prisma.estimate?.deleteMany().catch(() => {});
  await prisma.estimateRequest?.deleteMany().catch(() => {});

  // 4) 주소 연계 테이블
  await prisma.customerAddress?.deleteMany?.().catch(() => {});
  await prisma.driverServiceArea?.deleteMany?.().catch(() => {});

  // 5) 주소/주체
  await prisma.address?.deleteMany().catch(() => {});

  await prisma.driver?.deleteMany().catch(() => {});
  await prisma.customer?.deleteMany().catch(() => {});

  // 6) 최후에 사용자
  await prisma.authUser?.deleteMany().catch(() => {});
}
