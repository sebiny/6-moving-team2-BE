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
const favorite_repository_1 = __importDefault(require("../repositories/favorite.repository"));
function getAllFavoriteDrivers(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield favorite_repository_1.default.getAllFavoriteDrivers(userId);
    });
}
function createFavorite(driverId, customerId) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield favorite_repository_1.default.createFavorite(driverId, customerId);
    });
}
function deleteFavorite(driverId, customerId) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield favorite_repository_1.default.deleteFavorite(driverId, customerId);
    });
}
exports.default = {
    getAllFavoriteDrivers,
    createFavorite,
    deleteFavorite
};
//# sourceMappingURL=favorite.service.js.map