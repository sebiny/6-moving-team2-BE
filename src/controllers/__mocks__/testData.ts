import { MoveType, RegionType, RequestStatus, EstimateStatus, UserType } from "@prisma/client";

// 테스트용 모의 데이터 생성 유틸리티
export const createMockData = () => {
  // 기본 사용자 데이터
  const mockUsers = {
    customers: [
      {
        id: "c1",
        authUser: {
          id: "u1",
          email: "testuser0@test.com",
          name: "김테스트",
          userType: UserType.CUSTOMER
        },
        moveType: [MoveType.SMALL],
        currentArea: "강남구",
        moveDate: new Date("2025-08-01")
      },
      {
        id: "c2",
        authUser: {
          id: "u2",
          email: "testuser1@test.com",
          name: "이테스트",
          userType: UserType.CUSTOMER
        },
        moveType: [MoveType.HOME],
        currentArea: "송파구",
        moveDate: new Date("2025-08-02")
      }
    ],
    drivers: [
      {
        id: "d1",
        authUser: {
          id: "u3",
          email: "driver0@test.com",
          name: "김기사",
          userType: UserType.DRIVER
        },
        nickname: "친절한김기사",
        shortIntro: "10년 경력의 전문 이사 기사입니다.",
        moveType: [MoveType.SMALL, MoveType.HOME, MoveType.OFFICE],
        career: 5,
        work: 50,
        averageRating: 4.5
      },
      {
        id: "d2",
        authUser: {
          id: "u4",
          email: "driver1@test.com",
          name: "이기사",
          userType: UserType.DRIVER
        },
        nickname: "신속한이기사",
        shortIntro: "고객 만족을 최우선으로 하는 이사 전문가입니다.",
        moveType: [MoveType.SMALL, MoveType.HOME, MoveType.OFFICE],
        career: 6,
        work: 60,
        averageRating: 4.2
      }
    ]
  };

  // 주소 데이터
  const mockAddresses = [
    {
      id: "addr1",
      postalCode: "11111",
      street: "서울특별시 강남구 테헤란로 123",
      detail: "101호",
      region: RegionType.SEOUL,
      district: "강남구"
    },
    {
      id: "addr2",
      postalCode: "11112",
      street: "서울특별시 송파구 올림픽로 456",
      detail: "202호",
      region: RegionType.SEOUL,
      district: "송파구"
    },
    {
      id: "addr3",
      postalCode: "22222",
      street: "부산광역시 해운대구 해운대로 321",
      detail: "404호",
      region: RegionType.BUSAN,
      district: "해운대구"
    }
  ];

  // 견적 요청 데이터 (실제 함수에서 기대하는 구조)
  const mockEstimateRequests = [
    {
      id: "req1",
      customerId: "c1",
      moveType: MoveType.SMALL,
      moveDate: new Date(Date.now() + 86400000 * 30), // 30일 후
      fromAddressId: "addr1",
      toAddressId: "addr3",
      status: RequestStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      // getDesignatedEstimateRequests에서 기대하는 구조
      customer: {
        id: "c1",
        authUser: {
          name: "김테스트"
        }
      },
      fromAddress: {
        id: "addr1",
        region: RegionType.SEOUL,
        district: "강남구"
      },
      toAddress: {
        id: "addr3",
        region: RegionType.BUSAN,
        district: "해운대구"
      },
      _count: {
        estimates: 2
      }
    },
    {
      id: "req2",
      customerId: "c2",
      moveType: MoveType.HOME,
      moveDate: new Date(Date.now() + 86400000 * 7), // 7일 후
      fromAddressId: "addr2",
      toAddressId: "addr3",
      status: RequestStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      // getAvailableEstimateRequests에서 기대하는 구조
      customer: {
        id: "c2",
        authUser: {
          name: "이테스트"
        }
      },
      fromAddress: {
        id: "addr2",
        region: RegionType.SEOUL,
        district: "송파구"
      },
      toAddress: {
        id: "addr3",
        region: RegionType.BUSAN,
        district: "해운대구"
      },
      _count: {
        estimates: 1
      }
    },
    {
      id: "req3",
      customerId: "c1",
      moveType: MoveType.OFFICE,
      moveDate: new Date(Date.now() + 86400000), // 내일
      fromAddressId: "addr1",
      toAddressId: "addr2",
      status: RequestStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      customer: {
        id: "c1",
        authUser: {
          name: "김테스트"
        }
      },
      fromAddress: {
        id: "addr1",
        region: RegionType.SEOUL,
        district: "강남구"
      },
      toAddress: {
        id: "addr2",
        region: RegionType.SEOUL,
        district: "송파구"
      },
      _count: {
        estimates: 0
      }
    }
  ];

  // 견적 데이터 (getMyEstimates에서 기대하는 구조)
  const mockEstimates = [
    {
      id: "est1",
      estimateRequestId: "req1",
      driverId: "d1",
      price: 50000,
      comment: "소형이사 견적 제안드립니다.",
      status: EstimateStatus.PROPOSED,
      isDesignated: true,
      createdAt: new Date("2024-01-02"),
      updatedAt: new Date("2024-01-02"),
      deletedAt: null,
      // getMyEstimates에서 기대하는 구조
      estimateRequest: {
        id: "req1",
        status: RequestStatus.PENDING,
        moveDate: new Date(Date.now() + 86400000 * 30),
        customer: {
          id: "c1",
          authUser: {
            name: "김테스트"
          }
        },
        fromAddress: {
          id: "addr1",
          region: RegionType.SEOUL,
          district: "강남구"
        },
        toAddress: {
          id: "addr3",
          region: RegionType.BUSAN,
          district: "해운대구"
        }
      }
    },
    {
      id: "est2",
      estimateRequestId: "req2",
      driverId: "d1",
      price: 150000,
      comment: "가정이사 견적 제안드립니다.",
      status: EstimateStatus.ACCEPTED,
      isDesignated: false,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
      deletedAt: null,
      estimateRequest: {
        id: "req2",
        status: RequestStatus.PENDING,
        moveDate: new Date(Date.now() + 86400000 * 7),
        customer: {
          id: "c2",
          authUser: {
            name: "이테스트"
          }
        },
        fromAddress: {
          id: "addr2",
          region: RegionType.SEOUL,
          district: "송파구"
        },
        toAddress: {
          id: "addr3",
          region: RegionType.BUSAN,
          district: "해운대구"
        }
      }
    }
  ];

  // 지정 기사 데이터
  const mockDesignatedDrivers = [
    {
      id: "dd1",
      estimateRequestId: "req1",
      driverId: "d1",
      createdAt: new Date()
    },
    {
      id: "dd2",
      estimateRequestId: "req2",
      driverId: "d1",
      createdAt: new Date()
    }
  ];

  // 견적 반려 데이터 (getRejectedEstimateRequests에서 기대하는 구조)
  const mockEstimateRejections = [
    {
      id: "rej1",
      driverId: "d1",
      estimateRequestId: "req3",
      reason: "일정이 맞지 않습니다.",
      createdAt: new Date("2024-01-02"),
      estimateRequest: {
        id: "req3",
        status: RequestStatus.PENDING,
        moveDate: new Date(Date.now() + 86400000),
        customer: {
          id: "c1",
          authUser: {
            name: "김테스트"
          }
        },
        fromAddress: {
          id: "addr1",
          region: RegionType.SEOUL,
          district: "강남구"
        },
        toAddress: {
          id: "addr2",
          region: RegionType.SEOUL,
          district: "송파구"
        },
        designatedDrivers: [],
        isDesignated: false
      }
    },
    {
      id: "rej2",
      driverId: "d1",
      estimateRequestId: "req1",
      reason: "가격이 맞지 않습니다.",
      createdAt: new Date("2024-01-01"),
      estimateRequest: {
        id: "req1",
        status: RequestStatus.PENDING,
        moveDate: new Date(Date.now() + 86400000 * 30),
        customer: {
          id: "c1",
          authUser: {
            name: "김테스트"
          }
        },
        fromAddress: {
          id: "addr1",
          region: RegionType.SEOUL,
          district: "강남구"
        },
        toAddress: {
          id: "addr3",
          region: RegionType.BUSAN,
          district: "해운대구"
        },
        designatedDrivers: [{ driverId: "d1" }],
        isDesignated: true
      }
    }
  ];

  // 기사 서비스 지역 데이터
  const mockDriverServiceAreas = [
    {
      id: "dsa1",
      driverId: "d1",
      region: RegionType.SEOUL
    },
    {
      id: "dsa2",
      driverId: "d1",
      region: RegionType.BUSAN
    }
  ];

  return {
    users: mockUsers,
    addresses: mockAddresses,
    estimateRequests: mockEstimateRequests,
    estimates: mockEstimates,
    designatedDrivers: mockDesignatedDrivers,
    estimateRejections: mockEstimateRejections,
    driverServiceAreas: mockDriverServiceAreas
  };
};

// 특정 테스트 시나리오용 데이터 생성
export const createTestScenarioData = (scenario: string) => {
  const baseData = createMockData();

  switch (scenario) {
    case "createEstimate":
      return {
        ...baseData,
        estimateRequests: [
          {
            ...baseData.estimateRequests[0],
            id: "req1",
            status: RequestStatus.PENDING,
            moveDate: new Date(Date.now() + 86400000 * 30) // 30일 후
          }
        ]
      };

    case "rejectEstimateRequest":
      return {
        ...baseData,
        estimateRequests: [
          {
            ...baseData.estimateRequests[0],
            id: "req1",
            status: RequestStatus.PENDING,
            moveDate: new Date(Date.now() + 86400000) // 내일
          }
        ]
      };

    default:
      return baseData;
  }
};

// 서비스 응답 모의 데이터 (실제 함수 반환값 구조에 맞춤)
export const createMockServiceResponses = () => ({
  // Driver Repository 응답들
  getDesignatedEstimateRequests: [
    {
      id: "req1",
      status: RequestStatus.PENDING,
      moveType: MoveType.SMALL,
      moveDate: new Date(Date.now() + 86400000 * 30),
      customer: {
        id: "c1",
        authUser: { name: "김테스트" }
      },
      fromAddress: {
        id: "addr1",
        region: RegionType.SEOUL,
        district: "강남구"
      },
      toAddress: {
        id: "addr3",
        region: RegionType.BUSAN,
        district: "해운대구"
      },
      _count: { estimates: 2 },
      isDesignated: true,
      estimateCount: 2
    }
  ],

  getAvailableEstimateRequests: [
    {
      id: "req2",
      status: RequestStatus.PENDING,
      moveType: MoveType.HOME,
      moveDate: new Date(Date.now() + 86400000 * 7),
      customer: {
        id: "c2",
        authUser: { name: "이테스트" }
      },
      fromAddress: {
        id: "addr2",
        region: RegionType.SEOUL,
        district: "송파구"
      },
      toAddress: {
        id: "addr3",
        region: RegionType.BUSAN,
        district: "해운대구"
      },
      _count: { estimates: 1 },
      isDesignated: false,
      estimateCount: 1
    }
  ],

  getAllEstimateRequests: [
    {
      id: "req1",
      status: RequestStatus.PENDING,
      moveType: MoveType.SMALL,
      moveDate: new Date(Date.now() + 86400000 * 30),
      customer: {
        id: "c1",
        authUser: { name: "김테스트" }
      },
      fromAddress: {
        id: "addr1",
        region: RegionType.SEOUL,
        district: "강남구"
      },
      toAddress: {
        id: "addr3",
        region: RegionType.BUSAN,
        district: "해운대구"
      },
      _count: { estimates: 2 },
      isDesignated: true,
      estimateCount: 2
    },
    {
      id: "req2",
      status: RequestStatus.PENDING,
      moveType: MoveType.HOME,
      moveDate: new Date(Date.now() + 86400000 * 7),
      customer: {
        id: "c2",
        authUser: { name: "이테스트" }
      },
      fromAddress: {
        id: "addr2",
        region: RegionType.SEOUL,
        district: "송파구"
      },
      toAddress: {
        id: "addr3",
        region: RegionType.BUSAN,
        district: "해운대구"
      },
      _count: { estimates: 1 },
      isDesignated: false,
      estimateCount: 1
    }
  ],

  findEstimateByDriverAndRequest: {
    id: "est1",
    driverId: "d1",
    estimateRequestId: "req1",
    price: 50000,
    status: EstimateStatus.PROPOSED,
    deletedAt: null
  },

  createEstimate: {
    id: "est1",
    estimateRequestId: "req1",
    driverId: "d1",
    price: 50000,
    comment: "견적 메시지",
    status: EstimateStatus.PROPOSED,
    isDesignated: false,
    createdAt: new Date()
  },

  rejectEstimate: {
    id: "est1",
    status: EstimateStatus.REJECTED,
    rejectReason: "일정이 맞지 않습니다"
  },

  getMyEstimates: [
    {
      id: "est1",
      price: 50000,
      comment: "소형이사 견적 제안드립니다.",
      status: EstimateStatus.PROPOSED,
      isDesignated: true,
      createdAt: new Date("2024-01-02"),
      completionStatus: null,
      isCompleted: false,
      customerName: "김테스트",
      estimateRequest: {
        id: "req1",
        status: RequestStatus.PENDING,
        moveDate: new Date(Date.now() + 86400000 * 30),
        customer: {
          id: "c1",
          authUser: { name: "김테스트" }
        },
        fromAddress: {
          id: "addr1",
          region: RegionType.SEOUL,
          district: "강남구"
        },
        toAddress: {
          id: "addr3",
          region: RegionType.BUSAN,
          district: "해운대구"
        }
      }
    },
    {
      id: "est2",
      price: 150000,
      comment: "가정이사 견적 제안드립니다.",
      status: EstimateStatus.ACCEPTED,
      isDesignated: false,
      createdAt: new Date("2024-01-01"),
      completionStatus: null,
      isCompleted: false,
      customerName: "이테스트",
      estimateRequest: {
        id: "req2",
        status: RequestStatus.PENDING,
        moveDate: new Date(Date.now() + 86400000 * 7),
        customer: {
          id: "c2",
          authUser: { name: "이테스트" }
        },
        fromAddress: {
          id: "addr2",
          region: RegionType.SEOUL,
          district: "송파구"
        },
        toAddress: {
          id: "addr3",
          region: RegionType.BUSAN,
          district: "해운대구"
        }
      }
    }
  ],

  getEstimateDetail: {
    id: "est1",
    driverId: "d1",
    price: 50000,
    comment: "소형이사 견적 제안드립니다.",
    status: EstimateStatus.PROPOSED,
    deletedAt: null,
    estimateRequest: {
      id: "req1",
      status: RequestStatus.PENDING,
      moveDate: new Date(Date.now() + 86400000 * 30),
      customer: {
        id: "c1",
        authUser: { name: "김테스트" }
      },
      fromAddress: {
        id: "addr1",
        region: RegionType.SEOUL,
        district: "강남구"
      },
      toAddress: {
        id: "addr3",
        region: RegionType.BUSAN,
        district: "해운대구"
      }
    }
  },

  getRejectedEstimateRequests: [
    {
      id: "rej1",
      driverId: "d1",
      estimateRequestId: "req3",
      reason: "일정이 맞지 않습니다.",
      createdAt: new Date("2024-01-02"),
      estimateRequest: {
        id: "req3",
        status: RequestStatus.PENDING,
        moveDate: new Date(Date.now() + 86400000),
        customer: {
          id: "c1",
          authUser: { name: "김테스트" }
        },
        fromAddress: {
          id: "addr1",
          region: RegionType.SEOUL,
          district: "강남구"
        },
        toAddress: {
          id: "addr2",
          region: RegionType.SEOUL,
          district: "송파구"
        },
        designatedDrivers: [],
        isDesignated: false
      }
    },
    {
      id: "rej2",
      driverId: "d1",
      estimateRequestId: "req1",
      reason: "가격이 맞지 않습니다.",
      createdAt: new Date("2024-01-01"),
      estimateRequest: {
        id: "req1",
        status: RequestStatus.PENDING,
        moveDate: new Date(Date.now() + 86400000 * 30),
        customer: {
          id: "c1",
          authUser: { name: "김테스트" }
        },
        fromAddress: {
          id: "addr1",
          region: RegionType.SEOUL,
          district: "강남구"
        },
        toAddress: {
          id: "addr3",
          region: RegionType.BUSAN,
          district: "해운대구"
        },
        designatedDrivers: [{ driverId: "d1" }],
        isDesignated: true
      }
    }
  ],

  checkResponseLimit: {
    canRespond: true,
    limit: 5,
    currentCount: 0,
    message: "응답 가능합니다"
  },

  // Driver Service 응답들
  getAllDrivers: [
    {
      id: "d1",
      nickname: "친절한김기사",
      shortIntro: "10년 경력의 전문 이사 기사입니다.",
      averageRating: 4.5,
      reviewCount: 10,
      career: 5,
      work: 50
    }
  ],

  getDriverById: {
    id: "d1",
    nickname: "친절한김기사",
    shortIntro: "10년 경력의 전문 이사 기사입니다.",
    detailIntro: "10년 경력의 전문 이사 기사입니다. 고객님의 만족을 위해 최선을 다하겠습니다.",
    averageRating: 4.5,
    reviewCount: 10,
    career: 5,
    work: 50,
    moveType: [MoveType.SMALL, MoveType.HOME, MoveType.OFFICE]
  },

  // Estimate Request Service 응답들
  findRequestById: {
    id: "req1",
    status: RequestStatus.PENDING,
    moveDate: new Date(Date.now() + 86400000 * 30),
    customerId: "c1",
    moveType: MoveType.SMALL
  },

  checkIfAlreadyRejected: false,

  rejectEstimateRequest: {
    id: "rej1",
    driverId: "d1",
    estimateRequestId: "req1",
    reason: "반려 사유",
    createdAt: new Date()
  },

  // Notification Service 응답들
  createEstimateProposalNotification: undefined
});
