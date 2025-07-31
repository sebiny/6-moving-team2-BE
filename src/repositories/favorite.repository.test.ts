jest.mock("../config/prisma", () => ({
  favorite: {
    findMany: jest.fn(),
    create: jest.fn(),
    delete: jest.fn()
  }
}));

describe("Favorite Repository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe("GetAllFavoriteDrivers", () => {
    test("최대 3명의 찜한 기사를 반환한다.", async () => {});
  });
  describe("createFavorite", () => {
    test("찜하지 않은 기사일 경우 찜한 후 반환한다.", async () => {});
    test("찜한 기사일 경우 에러", async () => {});
  });
  describe("deleteFavorite", () => {
    test("찜한 기사일 경우 찜 해제한 후 반환한다.", async () => {});
    test("찜하지 않은 기사일 경우 에러", async () => {});
  });
});
