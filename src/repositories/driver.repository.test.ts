jest.mock("../config/prisma", () => ({
  driver: {
    findMany: jest.fn(),
    findUnique: jest.fn()
  }
}));

describe("Driver Repository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe("GetAllDrivers", () => {
    test("기본적으로 3명의 기사를 반환한다.", async () => {});
    test("검색 결과 일치하는 닉네임을 가지는 기사를 반환한다.", async () => {});
    test("지역 필터링 결과 일치하는 서비스 지역을 가지는 기사를 반환한다.", async () => {});
    test("서비스 필터링 결과 일치하는 서비스를 제공하는 기사를 반환한다.", async () => {});
    test("정렬 기준에 따른 기사를 반환한다.", async () => {});
    test("찜한 기사님일 경우 찜한 결과가 반영된 기사를 반환한다.", async () => {});
    test("기사가 없을 경우 빈 리스트를 반환한다.", async () => {});
  });
  describe("GetDriverById", () => {
    test("기사 ID에 따라 상세 정보를 반환한다.", async () => {});
    test("ID를 가진 기사가 없을 경우 ", async () => {});
  });
});
