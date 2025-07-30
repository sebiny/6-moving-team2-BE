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

// seed2용 데이터
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

// seed3용 데이터
const randomEmail3 = (index: number) => `user${index}@test.com`;
const randomName3 = ["김철수", "이영희", "박민수", "최지영", "한서준", "장도윤", "유지안", "서지우"];
const randomDistrict3 = ["강남구", "송파구", "은평구", "수성구", "남구", "해운대구", "중구", "동작구"];

async function main() {
  console.log("🌱 통합 시드 데이터 생성 시작...");

  // 기존 데이터 삭제 (외래키 제약조건 순서 고려)
  console.log("🧹 기존 테스트 데이터 삭제 중...");
  await prisma.driverEstimateRejection.deleteMany();
  await prisma.designatedDriver.deleteMany();
  await prisma.estimate.deleteMany();
  await prisma.review.deleteMany(); // EstimateRequest보다 먼저 삭제
  await prisma.estimateRequest.deleteMany();
  await prisma.customerAddress.deleteMany();
  await prisma.address.deleteMany();
  await prisma.driverServiceArea.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.notification.deleteMany();

  // 시드용 customer 삭제
  await prisma.customer.deleteMany({
    where: {
      authUser: {
        email: { startsWith: "testuser" }
      }
    }
  });

  // 시드용 driver 삭제
  await prisma.driver.deleteMany({
    where: {
      authUser: {
        email: { startsWith: "driver" }
      }
    }
  });

  // SEED3용 customer 삭제
  await prisma.customer.deleteMany({
    where: {
      authUser: {
        email: { startsWith: "user" }
      }
    }
  });

  // 시드용 user 삭제 (Customer, Driver 삭제 후)
  await prisma.authUser.deleteMany({
    where: {
      OR: [
        { email: { startsWith: "testuser" } },
        { email: { startsWith: "driver" } },
        { email: { startsWith: "user" } }
      ]
    }
  });

  console.log("✅ 기존 데이터 삭제 완료");

  // ===== SEED2: 테스트용 기본 데이터 =====
  console.log("\n📋 SEED2: 테스트용 기본 데이터 생성 중...");

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

  // ✅ 주소 5개 생성 (서울 3개, 부산 2개)
  const addressData = [
    // 서울 출발지/도착지
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
    // 부산 출발지/도착지
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
    }
  ];
  const addressList = await Promise.all(addressData.map((addr) => prisma.address.create({ data: addr })));
  console.log("✅ 주소 5개 생성 완료 (서울 3개, 부산 2개)");

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

  // ✅ 일반 견적 요청 8개 생성 (다양한 경로와 날짜)
  for (let i = 0; i < 8; i++) {
    const moveTypes = [MoveType.SMALL, MoveType.HOME, MoveType.OFFICE];
    const moveDate = i < 4 ? new Date() : new Date(`2025-08-${10 + i}`); // 오늘 4개, 미래 4개

    const req = await prisma.estimateRequest.create({
      data: {
        customerId: customerIds[i % customerIds.length],
        moveType: moveTypes[i % 3],
        moveDate: moveDate,
        fromAddressId: addressList[i % 3].id, // 서울 출발지 (0,1,2번)
        toAddressId: addressList[3 + (i % 2)].id, // 부산 도착지 (3,4번)
        status: RequestStatus.PENDING
      }
    });
    console.log(
      `✅ 일반 견적 요청 ${i + 1} 생성: ${req.id} (서울 ${addressList[i % 3].district} → 부산 ${addressList[3 + (i % 2)].district}, 날짜: ${moveDate.toLocaleDateString()})`
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

  // ✅ 지정 견적 요청 5개 생성 (기사1에게 모두 지정)
  for (let i = 0; i < 5; i++) {
    const moveDate = i < 2 ? new Date() : new Date(`2025-08-${15 + i}`); // 오늘 2개, 미래 3개

    const designatedRequest = await prisma.estimateRequest.create({
      data: {
        customerId: customerIds[i % customerIds.length],
        moveType: [MoveType.SMALL, MoveType.HOME, MoveType.OFFICE][i % 3],
        moveDate: moveDate,
        fromAddressId: addressList[i % 3].id, // 서울 출발지
        toAddressId: addressList[3 + (i % 2)].id, // 부산 도착지
        status: RequestStatus.PENDING,
        designatedDrivers: {
          create: {
            driverId: targetDriverId // 기사1에게 모두 지정
          }
        }
      }
    });

    console.log(
      `✅ 지정 견적 요청 ${i + 1} 생성: ${designatedRequest.id} (서울 ${addressList[i % 3].district} → 부산 ${addressList[3 + (i % 2)].district}, 지정기사: ${targetDriver?.nickname}, 날짜: ${moveDate.toLocaleDateString()})`
    );
  }

  // ===== SEED3: 완료된 견적 데이터 =====
  console.log("\n📋 SEED3: 완료된 견적 데이터 생성 중...");

  // 고객 3명 추가
  const customerIds3: string[] = [];
  for (let i = 0; i < 3; i++) {
    const authUser = await prisma.authUser.create({
      data: {
        email: randomEmail3(i + 10), // 기존과 겹치지 않도록 +10
        password: await hashPassword(`pw${i}1234`),
        phone: maskPhone(randomPhone()),
        userType: UserType.CUSTOMER,
        name: randomName3[i % randomName3.length],

        customer: {
          create: {
            moveType: i % 2 === 0 ? [MoveType.HOME] : [MoveType.OFFICE],
            currentArea: randomDistrict3[i % randomDistrict3.length],
            moveDate: new Date(`2025-08-0${i + 1}`)
          }
        }
      },
      include: { customer: true }
    });
    customerIds3.push(authUser.customer!.id);
    console.log(`✅ SEED3 고객 ${i + 1} 생성: ${authUser.customer!.id}`);
  }

  // 주소 5개 추가 (기존 주소 재사용)
  const addressList3 = addressList; // 기존 주소 재사용
  console.log("✅ SEED3 주소 재사용 (기존 5개 주소 사용)");

  // CustomerAddress 연결
  await Promise.all(
    customerIds3.map((cid) =>
      prisma.customerAddress.createMany({
        data: [
          { customerId: cid, addressId: addressList3[0].id, role: AddressRole.FROM },
          { customerId: cid, addressId: addressList3[1].id, role: AddressRole.TO }
        ],
        skipDuplicates: true
      })
    )
  );
  console.log("✅ SEED3 고객-주소 연결 완료");

  // 완료된 견적 데이터 추가 (실제 생성된 기사 ID 사용)
  const targetDriverId3 = driverIds[0]; // 첫 번째 기사 사용

  // 1. 확정 → 이사일 지남 (ACCEPTED 상태이면서 이사일이 지남)
  const completedRequest1 = await prisma.estimateRequest.create({
    data: {
      customerId: customerIds3[0],
      moveType: MoveType.SMALL,
      moveDate: new Date("2024-06-15"), // 과거 날짜
      fromAddressId: addressList3[0].id,
      toAddressId: addressList3[1].id,
      status: RequestStatus.APPROVED, // 승인된 상태
      designatedDrivers: {
        create: {
          driverId: targetDriverId3
        }
      }
    }
  });

  await prisma.estimate.create({
    data: {
      estimateRequestId: completedRequest1.id,
      driverId: targetDriverId3,
      price: 180000,
      comment: "소형이사 견적 제안드립니다.",
      status: EstimateStatus.ACCEPTED, // 확정된 상태
      createdAt: new Date("2024-06-10") // 과거 날짜
    }
  });
  console.log("✅ 완료된 견적 1 생성 (확정 → 이사일 지남)");

  // 2. 이사일 그냥 지남 (이사일이 지났지만 아직 확정되지 않음)
  const completedRequest2 = await prisma.estimateRequest.create({
    data: {
      customerId: customerIds3[1],
      moveType: MoveType.HOME,
      moveDate: new Date("2024-06-20"), // 과거 날짜
      fromAddressId: addressList3[2].id,
      toAddressId: addressList3[3].id,
      status: RequestStatus.PENDING, // 대기 중 상태
      designatedDrivers: {
        create: {
          driverId: targetDriverId3
        }
      }
    }
  });

  await prisma.estimate.create({
    data: {
      estimateRequestId: completedRequest2.id,
      driverId: targetDriverId3,
      price: 350000,
      comment: "가정이사 견적 제안드립니다.",
      status: EstimateStatus.PROPOSED, // 제안된 상태
      createdAt: new Date("2024-06-15") // 과거 날짜
    }
  });
  console.log("✅ 완료된 견적 2 생성 (이사일 지남)");

  // 3. 일반 요청으로 완료된 견적 (지정되지 않은 요청)
  const completedRequest3 = await prisma.estimateRequest.create({
    data: {
      customerId: customerIds3[2],
      moveType: MoveType.OFFICE,
      moveDate: new Date("2024-06-25"), // 과거 날짜
      fromAddressId: addressList3[4].id,
      toAddressId: addressList3[0].id,
      status: RequestStatus.APPROVED // 승인된 상태
      // designatedDrivers 없음 (일반 요청)
    }
  });

  await prisma.estimate.create({
    data: {
      estimateRequestId: completedRequest3.id,
      driverId: targetDriverId3,
      price: 500000,
      comment: "사무실이사 견적 제안드립니다.",
      status: EstimateStatus.ACCEPTED, // 확정된 상태
      createdAt: new Date("2024-06-20") // 과거 날짜
    }
  });
  console.log("✅ 완료된 견적 3 생성 (일반 요청)");

  console.log("\n🎉 통합 시드 데이터 생성 완료!");
  console.log("📊 생성된 데이터:");
  console.log("   - 고객: 8명 (SEED2: 5명 + SEED3: 3명)");
  console.log("   - 기사: 4명");
  console.log("   - 주소: 5개 (서울 3개, 부산 2개)");
  console.log("   - 일반 견적 요청: 8개 (오늘 4개, 미래 4개)");
  console.log("   - 지정 견적 요청: 5개 (오늘 2개, 미래 3개)");
  console.log("   - 완료된 견적: 3개 (스케줄러 테스트용)");
  console.log("🔑 테스트 계정:");
  console.log("   기사1: driver0@test.com / Driver0@123");
  console.log("   고객1: testuser0@test.com / Test0@123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
