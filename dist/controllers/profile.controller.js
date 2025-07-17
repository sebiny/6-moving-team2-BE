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
const asyncHandler_1 = require("../utils/asyncHandler");
const customError_1 = require("../utils/customError");
const profile_service_1 = __importDefault(require("../services/profile.service"));
// 고객 프로필 생성
const createCustomerProfile = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const authUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!authUserId)
        throw new customError_1.CustomError(401, "인증 정보가 없습니다.");
    const { profileImage, moveType, currentArea } = req.body;
    const profile = yield profile_service_1.default.createCustomerProfile(authUserId, {
        profileImage,
        moveType,
        currentArea
    });
    res.status(201).json(profile);
}));
// 고객 프로필 수정
const updateCustomerProfile = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const authUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!authUserId)
        throw new customError_1.CustomError(401, "인증 정보가 없습니다.");
    const { name, email, phone, currentPassword, newPassword, passwordConfirmation, profileImage, moveType, currentArea } = req.body;
    const updated = yield profile_service_1.default.updateCustomerProfile(authUserId, {
        name,
        email,
        phone,
        currentPassword,
        newPassword,
        passwordConfirmation,
        profileImage,
        moveType,
        currentArea
    });
    res.json(updated);
}));
// 고객 프로필 조회
const getCustomerProfile = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const customerId = req.params.id;
    const profile = yield profile_service_1.default.getCustomerProfile(customerId);
    res.json(profile);
}));
// 기사 프로필 생성
const createDriverProfile = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const authUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!authUserId)
        throw new customError_1.CustomError(401, "인증 정보가 없습니다.");
    const { profileImage, nickname, career, shortIntro, detailIntro, moveType, serviceAreas } = req.body;
    const result = yield profile_service_1.default.createDriverProfile(authUserId, {
        profileImage,
        nickname,
        career,
        shortIntro,
        detailIntro,
        moveType,
        serviceAreas
    });
    res.status(201).json(result);
}));
// 기사 프로필 수정
const updateDriverProfile = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const authUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!authUserId)
        throw new customError_1.CustomError(401, "인증 정보가 없습니다.");
    const { profileImage, nickname, career, shortIntro, detailIntro, moveType, serviceAreas } = req.body;
    const updated = yield profile_service_1.default.updateDriverProfile(authUserId, {
        profileImage,
        nickname,
        career,
        shortIntro,
        detailIntro,
        moveType,
        serviceAreas
    });
    res.json(updated);
}));
// 기사 프로필 조회
const getDriverProfile = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const driverId = req.params.id;
    const profile = yield profile_service_1.default.getDriverProfile(driverId);
    res.json(profile);
}));
exports.default = {
    createCustomerProfile,
    updateCustomerProfile,
    getCustomerProfile,
    createDriverProfile,
    updateDriverProfile,
    getDriverProfile
};
//# sourceMappingURL=profile.controller.js.map