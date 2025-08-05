import { PrismaClient, MoveType, RequestStatus, EstimateStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const customers = await prisma.customer.findMany();
  const drivers = await prisma.driver.findMany({ take: 3 });
  const addresses = await prisma.address.findMany({ take: 2 }); // [0] = from, [1] = to

  if (drivers.length < 1 || addresses.length < 2) {
    throw new Error("기사나 주소 데이터가 부족합니다.");
  }

  for (const customer of customers) {
    for (let i = 0; i < 5; i++) {
      const driver = drivers[i % drivers.length];

      const estimateRequest = await prisma.estimateRequest.create({
        data: {
          customerId: customer.id,
          moveType: MoveType.HOME,
          moveDate: new Date(`2025-08-${10 + i}`),
          fromAddressId: addresses[0].id,
          toAddressId: addresses[1].id,
          status: RequestStatus.COMPLETED,
          designatedDrivers: {
            create: {
              driverId: driver.id
            }
          }
        }
      });

      await prisma.estimate.create({
        data: {
          estimateRequestId: estimateRequest.id,
          driverId: driver.id,
          price: 150000 + i * 10000,
          comment: `리뷰용 견적 제안 (${i + 1})`,
          isDesignated: true,
          status: EstimateStatus.ACCEPTED
        }
      });
    }
  }

  console.log("✅ 모든 고객에게 리뷰 작성 가능한 견적 5개씩 생성 완료");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
