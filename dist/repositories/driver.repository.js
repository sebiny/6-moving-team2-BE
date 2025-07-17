"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../config/prisma"));
//기사님 찾기
function getAllDrivers(options, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const { keyword = "", orderBy = "work", region, service, page = 1 } = options;
        const orderByClause = orderBy === "reviewCount"
            ? {
                reviewsReceived: {
                    _count: "desc"
                }
            }
            : { [orderBy]: "desc" };
        const PAGE_SIZE = 10;
        const skip = (Number(page) - 1) * PAGE_SIZE;
        const drivers = yield prisma_1.default.driver.findMany({
            where: Object.assign(Object.assign({ OR: [
                    { nickname: { contains: keyword, mode: "insensitive" } },
                    { shortIntro: { contains: keyword, mode: "insensitive" } }
                ] }, (service && { moveType: { equals: service } })), (region && { serviceAreas: { some: { region } } })),
            // skip: skip,
            take: PAGE_SIZE,
            orderBy: orderByClause,
            include: {
                reviewsReceived: true,
                serviceAreas: true,
                Favorite: userId ? { where: { customerId: userId }, select: { id: true } } : false
            }
        });
        return drivers.map((driver) => {
            const isFavorite = userId ? driver.Favorite.length > 0 : false;
            const { Favorite } = driver, rest = __rest(driver, ["Favorite"]);
            return Object.assign(Object.assign({}, rest), { isFavorite });
        });
    });
}
//기사님 상세 정보
function getDriverById(id, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const driver = yield prisma_1.default.driver.findUnique({
            where: { id },
            include: {
                reviewsReceived: true,
                serviceAreas: true,
                Favorite: userId ? { where: { customerId: userId }, select: { id: true } } : false
            }
        });
        if (!driver)
            return null;
        const isFavorite = userId ? driver.Favorite.length > 1 : false;
        const { Favorite } = driver, rest = __rest(driver, ["Favorite"]);
        return Object.assign(Object.assign({}, rest), { isFavorite });
    });
}
//기사님 프로필 업데이트
function updateDriver(id, data) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield prisma_1.default.authUser.update({ where: { id }, data });
    });
}
exports.default = {
    getAllDrivers,
    getDriverById,
    updateDriver
};
//# sourceMappingURL=driver.repository.js.map