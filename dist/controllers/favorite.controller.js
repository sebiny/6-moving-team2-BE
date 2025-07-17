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
const favorite_service_1 = __importDefault(require("../services/favorite.service"));
const asyncHandler_1 = require("../utils/asyncHandler");
const customError_1 = require("../utils/customError");
const getAllFavoriteDrivers = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!userId)
        throw new customError_1.CustomError(401, "인증 정보가 없습니다.");
    const result = yield favorite_service_1.default.getAllFavoriteDrivers(userId);
    res.status(200).json(result);
}));
const createFavorite = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!userId)
        throw new customError_1.CustomError(401, "인증 정보가 없습니다.");
    const { id: driverId } = req.params;
    const result = yield favorite_service_1.default.createFavorite(driverId, userId);
    res.status(201).json(result);
}));
const deleteFavorite = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!userId)
        throw new customError_1.CustomError(401, "인증 정보가 없습니다.");
    const { id: driverId } = req.params;
    const result = yield favorite_service_1.default.deleteFavorite(driverId, userId);
    res.status(204).json(result);
}));
exports.default = {
    getAllFavoriteDrivers,
    createFavorite,
    deleteFavorite
};
//# sourceMappingURL=favorite.controller.js.map