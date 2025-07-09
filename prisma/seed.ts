import {
  PrismaClient,
  UserType,
  MoveType,
  RegionType,
  AddressRole,
  RequestStatus,
  EstimateStatus
} from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const hashPassword = async (plain: string) => await bcrypt.hash(plain, 10);
const maskPhone = (phone: string) => phone.replace(/(\d{3})\d{3,4}(\d{4})/, '$1****$2');

const randomEmail = (index: number) => `user${index}@test.com`;
const randomPhone = () => `010${Math.floor(1000 + Math.random() * 9000)}${Math.floor(1000 + Math.random() * 9000)}`;
const randomName = ['김철수', '이영희', '박민수', '최지영', '한서준', '장도윤', '유지안', '서지우'];
const randomDistrict = ['강남구', '송파구', '은평구', '수성구', '남구', '해운대구', '중구', '동작구'];
const randomRegion = [RegionType.SEOUL, RegionType.DAEGU, RegionType.GYEONGGI, RegionType.BUSAN];

async function main() {
  // 고객 5명
  const customerIds: string[] = [];
  for (let i = 0; i < 5; i++) {
    const authUser = await prisma.authUser.create({
      data: {
        email: randomEmail(i),
        password: await hashPassword(`pw${i}1234`),
        phone: maskPhone(randomPhone()),
        userType: UserType.CUSTOMER,
        name: randomName[i % randomName.length],

        customer: {
          create: {
            moveType: i % 2 === 0 ? MoveType.HOME : MoveType.OFFICE,
            currentArea: randomDistrict[i % randomDistrict.length],
            moveDate: new Date(`2025-08-0${i + 1}`)
          }
        }
      },
      include: { customer: true }
    });
    customerIds.push(authUser.customer!.id);
  }

  // 기사 3명
  const driverIds: string[] = [];
  for (let i = 0; i < 3; i++) {
    const authUser = await prisma.authUser.create({
      data: {
        email: `driver${i}@move.com`,
        password: await hashPassword(`driver${i}pass`),
        phone: maskPhone(randomPhone()),
        userType: UserType.DRIVER,
        name: randomName[(i + 5) % randomName.length],

        driver: {
          create: {
            nickname: `기사${i + 1}`,
            career: `${i + 1}년 경력`,
            shortIntro: `안녕하세요 기사${i + 1}입니다.`,
            detailIntro: `믿고 맡기세요.`,
            services: ['포장이사', '일반이사'],
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

  // 주소 5개
  const addressData = [
    {
      postalCode: '12345',
      street: '서울특별시 강남구 테헤란로 1길',
      detail: '101호',
      region: RegionType.SEOUL,
      district: '강남구'
    },
    {
      postalCode: '23456',
      street: '대구광역시 수성구 범어로 10',
      detail: '202호',
      region: RegionType.DAEGU,
      district: '수성구'
    },
    {
      postalCode: '34567',
      street: '경기도 수원시 장안구 정자동 88',
      detail: '303호',
      region: RegionType.GYEONGGI,
      district: '장안구'
    },
    {
      postalCode: '45678',
      street: '부산광역시 해운대구 해운대로 570',
      detail: '404호',
      region: RegionType.BUSAN,
      district: '해운대구'
    },
    {
      postalCode: '56789',
      street: '서울특별시 중구 을지로 100',
      detail: '505호',
      region: RegionType.SEOUL,
      district: '중구'
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

  // EstimateRequest + Estimate
  for (let i = 0; i < 3; i++) {
    const req = await prisma.estimateRequest.create({
      data: {
        customerId: customerIds[i],
        moveType: MoveType.HOME,
        moveDate: new Date(`2025-08-1${i}`),
        fromAddressId: addressList[0].id,
        toAddressId: addressList[1].id,
        status: RequestStatus.PENDING,
        designatedDriverId: driverIds[i]
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
  }

  console.log('🌱 랜덤 시드 완료 (고객/기사/주소/요청/견적 포함)');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
