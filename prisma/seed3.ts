import {
  PrismaClient,
  UserType,
  MoveType,
  RegionType,
  AddressRole,
  RequestStatus,
  EstimateStatus
} from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const hashPassword = async (plain: string) => await bcrypt.hash(plain, 10);
const maskPhone = (phone: string) => phone.replace(/(\d{3})\d{3,4}(\d{4})/, "$1****$2");

const randomEmail = (index: number) => `user${index}@test.com`;
const randomPhone = () => `010${Math.floor(1000 + Math.random() * 9000)}${Math.floor(1000 + Math.random() * 9000)}`;
const randomName = ["김철수", "이영희", "박민수", "최지영", "한서준", "장도윤", "유지안", "서지우"];
const randomDistrict = ["강남구", "송파구", "은평구", "수성구", "남구", "해운대구", "중구", "동작구"];
const randomRegion = [RegionType.SEOUL, RegionType.DAEGU, RegionType.GYEONGGI, RegionType.BUSAN];

async function main() {
  // 고객 3명
  const customerIds: string[] = [];
  for (let i = 0; i < 3; i++) {
    const authUser = await prisma.authUser.create({
      data: {
        email: randomEmail(i + 10), // 기존과 겹치지 않도록 +10
        password: await hashPassword(`pw${i}1234`),
        phone: maskPhone(randomPhone()),
        userType: UserType.CUSTOMER,
        name: randomName[i % randomName.length],

        customer: {
          create: {
            moveType: i % 2 === 0 ? [MoveType.HOME] : [MoveType.OFFICE],
            currentArea: randomDistrict[i % randomDistrict.length],
            moveDate: new Date(`2025-08-0${i + 1}`)
          }
        }
      },
      include: { customer: true }
    });
    customerIds.push(authUser.customer!.id);
  }

  // 주소 5개
  const addressData = [
    {
      postalCode: "12345",
      street: "서울특별시 강남구 테헤란로 1길",
      detail: "101호",
      region: RegionType.SEOUL,
      district: "강남구"
    },
    {
      postalCode: "23456",
      street: "대구광역시 수성구 범어로 10",
      detail: "202호",
      region: RegionType.DAEGU,
      district: "수성구"
    },
    {
      postalCode: "34567",
      street: "경기도 수원시 장안구 정자동 88",
      detail: "303호",
      region: RegionType.GYEONGGI,
      district: "장안구"
    },
    {
      postalCode: "45678",
      street: "부산광역시 해운대구 해운대로 570",
      detail: "404호",
      region: RegionType.BUSAN,
      district: "해운대구"
    },
    {
      postalCode: "56789",
      street: "서울특별시 중구 을지로 100",
      detail: "505호",
      region: RegionType.SEOUL,
      district: "중구"
    }
  ];

  const addressList = await Promise.all(addressData.map((addr) => prisma.address.create({ data: addr })));

  // CustomerAddress 연결
  await Promise.all(
    customerIds.map((cid) =>
      prisma.customerAddress.createMany({
        data: [
          { customerId: cid, addressId: addressList[0].id, role: AddressRole.FROM },
          { customerId: cid, addressId: addressList[1].id, role: AddressRole.TO }
        ],
        skipDuplicates: true
      })
    )
  );

  // 완료된 견적 데이터 추가 (기사 ID: cmdi3vuhr000rc9ukq9q97jz5)
  const targetDriverId = "cmdi3vuhr000rc9ukq9q97jz5";

  // 1. 확정 → 이사일 지남 (ACCEPTED 상태이면서 이사일이 지남)
  const completedRequest1 = await prisma.estimateRequest.create({
    data: {
      customerId: customerIds[0],
      moveType: MoveType.SMALL,
      moveDate: new Date("2024-06-15"), // 과거 날짜
      fromAddressId: addressList[0].id,
      toAddressId: addressList[1].id,
      status: RequestStatus.APPROVED, // 승인된 상태
      designatedDrivers: {
        create: {
          driverId: targetDriverId
        }
      }
    }
  });

  await prisma.estimate.create({
    data: {
      estimateRequestId: completedRequest1.id,
      driverId: targetDriverId,
      price: 180000,
      comment: "소형이사 견적 제안드립니다.",
      status: EstimateStatus.ACCEPTED, // 확정된 상태
      createdAt: new Date("2024-06-10") // 과거 날짜
    }
  });

  // 2. 이사일 그냥 지남 (이사일이 지났지만 아직 확정되지 않음)
  const completedRequest2 = await prisma.estimateRequest.create({
    data: {
      customerId: customerIds[1],
      moveType: MoveType.HOME,
      moveDate: new Date("2024-06-20"), // 과거 날짜
      fromAddressId: addressList[2].id,
      toAddressId: addressList[3].id,
      status: RequestStatus.PENDING, // 대기 중 상태
      designatedDrivers: {
        create: {
          driverId: targetDriverId
        }
      }
    }
  });

  await prisma.estimate.create({
    data: {
      estimateRequestId: completedRequest2.id,
      driverId: targetDriverId,
      price: 350000,
      comment: "가정이사 견적 제안드립니다.",
      status: EstimateStatus.PROPOSED, // 제안된 상태
      createdAt: new Date("2024-06-15") // 과거 날짜
    }
  });

  // 3. 일반 요청으로 완료된 견적 (지정되지 않은 요청)
  const completedRequest3 = await prisma.estimateRequest.create({
    data: {
      customerId: customerIds[2],
      moveType: MoveType.OFFICE,
      moveDate: new Date("2024-06-25"), // 과거 날짜
      fromAddressId: addressList[4].id,
      toAddressId: addressList[0].id,
      status: RequestStatus.APPROVED // 승인된 상태
      // designatedDrivers 없음 (일반 요청)
    }
  });

  await prisma.estimate.create({
    data: {
      estimateRequestId: completedRequest3.id,
      driverId: targetDriverId,
      price: 500000,
      comment: "사무실이사 견적 제안드립니다.",
      status: EstimateStatus.ACCEPTED, // 확정된 상태
      createdAt: new Date("2024-06-20") // 과거 날짜
    }
  });

  console.log("🌱 완료된 견적 시드 데이터 추가 완료");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
