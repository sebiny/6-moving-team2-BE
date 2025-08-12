import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function resetDB() {
  // 1. 가장 의존성이 낮은 것부터 삭제
  await prisma.notification.deleteMany().catch(() => {}); // 알림
  await prisma.favorite.deleteMany().catch(() => {}); // 찜
  await prisma.review.deleteMany().catch(() => {}); // 리뷰
  await prisma.driverEstimateRejection.deleteMany().catch(() => {}); // 견적 반려

  // 2. 견적 / 지정기사
  await prisma.designatedDriver.deleteMany().catch(() => {});
  await prisma.estimate.deleteMany().catch(() => {});
  await prisma.estimateRequest.deleteMany().catch(() => {});

  // 3. 고객/기사 관련 서브 테이블
  await prisma.customerAddress.deleteMany().catch(() => {});
  await prisma.driverServiceArea.deleteMany().catch(() => {});

  // 4. 언어 설정 (FK: Customer, Driver)
  await prisma.languagePreference.deleteMany().catch(() => {});

  // 5. 주소
  await prisma.address.deleteMany().catch(() => {});

  // 6. 주체 (Driver, Customer)
  await prisma.driver.deleteMany().catch(() => {});
  await prisma.customer.deleteMany().catch(() => {});

  // 7. 최종 AuthUser
  await prisma.authUser.deleteMany().catch(() => {});
}
