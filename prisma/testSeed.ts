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

const randomPhone = () => `010${Math.floor(1000 + Math.random() * 9000)}${Math.floor(1000 + Math.random() * 9000)}`;
const randomName = ["김철수", "이영희", "박민수", "최지영", "한서준", "장도윤", "유지안", "서지우"];
const randomDistrict = ["강남구", "송파구", "은평구", "수성구", "남구", "해운대구", "중구", "동작구"];
const randomRegion = [RegionType.SEOUL, RegionType.DAEGU, RegionType.GYEONGGI, RegionType.BUSAN];
const randomMoveTypes = [MoveType.HOME, MoveType.OFFICE, MoveType.SMALL];
const randomReview = [
  "최악이었어요. 추천하지 않습니다.",
  "생각보다 아쉬운 점이 많았습니다.",
  "무난했습니다. 특별히 좋지도 나쁘지도 않았어요.",
  "대체로 만족하지만 조금 더 꼼꼼했으면 좋았을 것 같아요.",
  "기사님이 너무 친절하시고 꼼꼼하셨어요."
];

async function main() {
  // 기존 데이터 삭제 (외래키 제약조건 순서 고려)
  console.log("🧹 기존 테스트 데이터 삭제 중...");
  await prisma.driverEstimateRejection.deleteMany();
  await prisma.designatedDriver.deleteMany();
  await prisma.review.deleteMany();
  await prisma.estimate.deleteMany();
  await prisma.estimateRequest.deleteMany();
  await prisma.customerAddress.deleteMany();
  await prisma.address.deleteMany();
  await prisma.driverServiceArea.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.authUser.deleteMany();
  console.log("✅ 기존 데이터 삭제 완료");

  console.log("시드 데이터 생성 중...");
  // 고객 5명
  const customerIds: string[] = [];
  for (let i = 0; i < 5; i++) {
    //랜덤 movetype
    const count = Math.floor(Math.random() * 3) + 1;
    const shuffled = [...randomMoveTypes].sort(() => 0.5 - Math.random());
    const randomList = shuffled.slice(0, count);

    const authUser = await prisma.authUser.create({
      data: {
        email: `customer${i + 1}@test.com`,
        password: await hashPassword(`1q2w3e4r!`),
        phone: maskPhone(randomPhone()),
        userType: UserType.CUSTOMER,
        name: randomName[i % randomName.length],

        customer: {
          create: {
            moveType: randomList,
            currentArea: randomDistrict[i % randomDistrict.length],
            moveDate: new Date(`2025-08-0${i + 1}`)
          }
        }
      },
      include: { customer: true }
    });
    customerIds.push(authUser.customer!.id);
  }

  // 기사 10명
  const driverIds: string[] = [];
  for (let i = 0; i < 10; i++) {
    const count = Math.floor(Math.random() * 3) + 1;
    const shuffled = [...randomMoveTypes].sort(() => 0.5 - Math.random());
    const randomList = shuffled.slice(0, count);
    const authUser = await prisma.authUser.create({
      data: {
        email: `driver${i}@test.com`,
        password: await hashPassword(`1q2w3e4r!`),
        phone: maskPhone(randomPhone()),
        userType: UserType.DRIVER,
        name: randomName[(i + 5) % randomName.length],

        driver: {
          create: {
            nickname: `기사${i + 1}`,
            work: Math.floor(Math.random() * 10) + 1,
            career: i + 1, // Int 타입으로 변경
            shortIntro: `안녕하세요 기사${i + 1}입니다.`,
            detailIntro: `열심히 하겠습니다. 믿고 맡겨주세요.`,
            moveType: randomList,
            serviceAreas: {
              create: [
                {
                  region: randomRegion[i % randomRegion.length],
                  district: randomDistrict[i % randomDistrict.length]
                }
              ]
            }
          }
        }
      },
      include: { driver: true }
    });
    driverIds.push(authUser.driver!.id);
  }

  //찜하기
  for (let i = 0; i < 5; i++) {
    const shuffled = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => 0.5 - Math.random());
    const randomList = shuffled.slice(0, 3);

    for (const idx of randomList) {
      const favorite = await prisma.favorite.create({
        data: {
          customerId: customerIds[i],
          driverId: driverIds[idx]
        }
      });
    }
  }

  console.log("🌱 기사, 고객, 찜하기 생성 완료");

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

  // 리뷰용 확정된 견적
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 20; j++) {
      const estimateRequest = await prisma.estimateRequest.create({
        data: {
          customerId: customerIds[i],
          moveType: MoveType.HOME,
          moveDate: new Date(2025, 6, j + 1),
          fromAddressId: addressList[0].id,
          toAddressId: addressList[1].id,
          status: RequestStatus.COMPLETED,
          designatedDrivers: {
            create: {
              driverId: driverIds[j % 10]
            }
          }
        }
      });

      await prisma.estimate.create({
        data: {
          estimateRequestId: estimateRequest.id,
          driverId: driverIds[j % 10],
          price: 150000 + i * 10000,
          comment: `견적 제안드립니다 (${j + 1})`,
          isDesignated: true,
          status: EstimateStatus.ACCEPTED
        }
      });
      const ratingNum = Math.floor(Math.random() * 5) + 1;
      if (j % 2 === 0) {
        await prisma.review.create({
          data: {
            estimateRequestId: estimateRequest.id,
            driverId: driverIds[j % 10],
            rating: ratingNum,
            content: randomReview[ratingNum - 1],
            customerId: customerIds[i]
          }
        });
      }
    }
  }

  //리뷰 평점 업데이트
  for (const driverId of driverIds) {
    const reviews = await prisma.review.findMany({
      where: { driverId },
      select: { rating: true }
    });

    const total = reviews.reduce((acc, curr) => acc + curr.rating, 0);
    const average = reviews.length ? total / reviews.length : 0;

    await prisma.driver.update({
      where: { id: driverId },
      data: { averageRating: parseFloat(average.toFixed(2)) }
    });
  }

  console.log("🌱 리뷰 생성 완료");

  // EstimateRequest + Estimate + DesignatedDriver
  for (let i = 0; i < 5; i++) {
    const req = await prisma.estimateRequest.create({
      data: {
        customerId: customerIds[i],
        moveType: MoveType.HOME,
        moveDate: new Date(`2025-08-2${i}`),
        fromAddressId: addressList[0].id,
        toAddressId: addressList[1].id,
        status: RequestStatus.PENDING,
        designatedDrivers: {
          create: {
            driverId: driverIds[i]
          }
        }
      }
    });

    await prisma.estimate.create({
      data: {
        estimateRequestId: req.id,
        driverId: driverIds[i],
        price: 100000 + i * 50000,
        comment: `견적 제안드립니다 (${i + 1})`,
        isDesignated: true,
        status: EstimateStatus.PROPOSED
      }
    });

    // DriverEstimateRejection 샘플 데이터 추가
    if (i === 0) {
      await prisma.driverEstimateRejection.create({
        data: {
          estimateRequestId: req.id,
          driverId: driverIds[i],
          reason: "일정이 맞지 않아서 반려합니다."
        }
      });
    }
  }
  console.log("🌱 견적 및 요청 생성 완료");
  console.log("🌱 랜덤 시드 완료");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
