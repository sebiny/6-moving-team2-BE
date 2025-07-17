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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../config/prisma"));
//찜한 기사님 불러오기
function getAllFavoriteDrivers(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield prisma_1.default.favorite.findMany({ where: { customerId: userId } });
    });
}
//찜하기
function createFavorite(driverId, customerId) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield prisma_1.default.favorite.create({ data: { customerId, driverId } });
    });
}
//찜하기 삭제
function deleteFavorite(driverId, customerId) {
    return __awaiter(this, void 0, void 0, function* () {
        return prisma_1.default.favorite.delete({ where: { customerId_driverId: { driverId, customerId } } });
    });
}
exports.default = {
    getAllFavoriteDrivers,
    createFavorite,
    deleteFavorite
};
//# sourceMappingURL=favorite.repository.js.map