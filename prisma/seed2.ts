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

const randomEmail = (index: number) => `testuser${index}@test.com`;
const randomPhone = () => `010${Math.floor(1000 + Math.random() * 9000)}${Math.floor(1000 + Math.random() * 9000)}`;
const randomName = ["김테스트", "이테스트", "박테스트", "최테스트", "한테스트"];
const randomDistrict = ["강남구", "송파구", "서초구", "마포구", "용산구"];
const randomRegion = [RegionType.SEOUL, RegionType.DAEGU, RegionType.GYEONGGI];

const driverNames = ["김기사", "이기사", "박기사", "최기사"];
const driverNicknames = ["친절한김기사", "신속한이기사", "안전한박기사", "정확한최기사"];
const driverIntros = [
  "10년 경력의 전문 이사 기사입니다.",
  "고객 만족을 최우선으로 하는 이사 전문가입니다.",
  "깔끔하고 정확한 이사 서비스로 고객님의 만족을 보장합니다.",
  "오랜 경험을 바탕으로 한 전문적인 이사 서비스를 제공합니다."
];

const serviceAreas = [
  { region: RegionType.SEOUL }, // 서울 전체
  { region: RegionType.BUSAN }, // 부산 전체
  { region: RegionType.GYEONGGI } // 경기도 전체
];

async function main() {
  console.log("🌱 테스트용 시드 데이터 생성 시작...");
  await prisma.driverEstimateRejection.deleteMany(); // 새로운 모델 먼저 삭제
  await prisma.designatedDriver.deleteMany();
  await prisma.estimate.deleteMany();
  await prisma.estimateRequest.deleteMany();
  await prisma.customerAddress.deleteMany();
  await prisma.address.deleteMany();
  await prisma.driverServiceArea.deleteMany();
  await prisma.favorite.deleteMany(); // Driver를 참조하는 테이블 먼저 삭제
  await prisma.notification.deleteMany(); // AuthUser 참조하는 테이블 먼저 삭제

  // 시드용 customer 먼저 삭제
  await prisma.customer.deleteMany({
    where: {
      authUser: {
        email: { startsWith: "testuser" }
      }
    }
  });

  // 시드용 driver 먼저 삭제
  await prisma.driver.deleteMany({
    where: {
      authUser: {
        email: { startsWith: "driver" }
      }
    }
  });

  // 마지막으로 authUser 삭제
  await prisma.authUser.deleteMany({
    where: {
      OR: [{ email: { startsWith: "testuser" } }, { email: { startsWith: "driver" } }]
    }
  });

  // ✅ 고객 5명 생성
  const customerIds: string[] = [];
  for (let i = 0; i < 5; i++) {
    const authUser = await prisma.authUser.create({
      data: {
        email: randomEmail(i),
        password: await hashPassword(`Test${i}@123`),
        phone: maskPhone(randomPhone()),
        userType: UserType.CUSTOMER,
        name: randomName[i],

        customer: {
          create: {
            moveType: [[MoveType.SMALL], [MoveType.HOME], [MoveType.OFFICE]][i % 3],
            currentArea: randomDistrict[i],
            moveDate: new Date(`2025-08-0${i + 1}`)
          }
        }
      },
      include: { customer: true }
    });
    if (authUser.customer) {
      customerIds.push(authUser.customer.id);
      console.log(`✅ 고객 ${i + 1} 생성: ${authUser.customer.id}`);
    }
  }

  // ✅ 주소 6개 생성 (서울 출발지 3개, 부산 도착지 3개)
  const addressData = [
    // 서울 출발지
    {
      postalCode: "11111",
      street: "서울특별시 강남구 테헤란로 123",
      detail: "101호",
      region: RegionType.SEOUL,
      district: "강남구"
    },
    {
      postalCode: "11112",
      street: "서울특별시 송파구 올림픽로 456",
      detail: "202호",
      region: RegionType.SEOUL,
      district: "송파구"
    },
    {
      postalCode: "11113",
      street: "서울특별시 서초구 서초대로 789",
      detail: "303호",
      region: RegionType.SEOUL,
      district: "서초구"
    },
    // 부산 도착지
    {
      postalCode: "22222",
      street: "부산광역시 해운대구 해운대로 321",
      detail: "404호",
      region: RegionType.BUSAN,
      district: "해운대구"
    },
    {
      postalCode: "22223",
      street: "부산광역시 부산진구 중앙대로 654",
      detail: "505호",
      region: RegionType.BUSAN,
      district: "부산진구"
    },
    {
      postalCode: "22224",
      street: "부산광역시 동래구 동래로 987",
      detail: "606호",
      region: RegionType.BUSAN,
      district: "동래구"
    }
  ];
  const addressList = await Promise.all(addressData.map((addr) => prisma.address.create({ data: addr })));
  console.log("✅ 주소 6개 생성 완료 (서울 3개, 부산 3개)");

  // ✅ 고객-주소 연결
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
  console.log("✅ 고객-주소 연결 완료");

  // ✅ 기사 4명 생성
  const driverIds: string[] = [];
  for (let i = 0; i < 4; i++) {
    const authUser = await prisma.authUser.create({
      data: {
        email: `driver${i}@test.com`,
        password: await hashPassword(`Driver${i}@123`),
        phone: maskPhone(randomPhone()),
        userType: UserType.DRIVER,
        name: driverNames[i],

        driver: {
          create: {
            nickname: driverNicknames[i],
            shortIntro: driverIntros[i],
            detailIntro: `${driverIntros[i]} 고객님의 만족을 위해 최선을 다하겠습니다.`,
            moveType: [MoveType.SMALL, MoveType.HOME, MoveType.OFFICE],
            career: 5 + i,
            work: 50 + i * 10,
            averageRating: 4.0 + Math.random()
          }
        }
      },
      include: { driver: true }
    });
    if (authUser.driver) {
      driverIds.push(authUser.driver.id);
      console.log(`✅ 기사 ${i + 1} 생성: ${authUser.driver.id} (${authUser.driver.nickname})`);
    }
  }

  // ✅ 기사별 서비스 지역 등록 (광역시/도 단위)
  for (let i = 0; i < driverIds.length; i++) {
    const { region } = serviceAreas[i % serviceAreas.length];
    await prisma.driverServiceArea.create({
      data: {
        driverId: driverIds[i],
        region,
        district: null // 광역시/도 전체를 의미
      }
    });
    console.log(`✅ 기사 ${i + 1} 서비스 지역 설정: ${region} 전체`);
  }

  // ✅ 일반 견적 요청 5개 생성 (서울 → 부산)
  for (let i = 0; i < 5; i++) {
    const req = await prisma.estimateRequest.create({
      data: {
        customerId: customerIds[i],
        moveType: [MoveType.SMALL, MoveType.HOME, MoveType.OFFICE][i % 3],
        moveDate: new Date(`2025-08-${10 + i}`),
        fromAddressId: addressList[i % 3].id, // 서울 출발지 (0,1,2번)
        toAddressId: addressList[3 + (i % 3)].id, // 부산 도착지 (3,4,5번)
        status: RequestStatus.PENDING
      }
    });
    console.log(
      `✅ 일반 견적 요청 ${i + 1} 생성: ${req.id} (서울 ${addressList[i % 3].district} → 부산 ${addressList[3 + (i % 3)].district})`
    );
  }

  // 타겟 기사는 기사1 (driverIds[0])
  const targetDriverId = driverIds[0];
  const targetDriver = await prisma.driver.findUnique({
    where: { id: targetDriverId }
  });

  console.log(`✅ 타겟 기사 설정: ${targetDriver?.nickname} (${targetDriverId})`);
  console.log(`🔑 기사1 로그인 정보:`);
  console.log(`   이메일: driver0@test.com`);
  console.log(`   비밀번호: Driver0@123`);

  // ✅ 첫 번째 견적 요청을 타겟 기사(기사1)에게 지정
  const firstRequest = await prisma.estimateRequest.findFirst({
    where: { status: RequestStatus.PENDING }
  });

  if (firstRequest) {
    await prisma.designatedDriver.create({
      data: {
        estimateRequestId: firstRequest.id,
        driverId: targetDriverId
      }
    });
    console.log(`✅ 첫 번째 견적 요청을 지정 기사에게 연결: ${firstRequest.id} (지정기사: ${targetDriverId})`);
  }

  console.log("🎉 테스트용 시드 데이터 생성 완료!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
