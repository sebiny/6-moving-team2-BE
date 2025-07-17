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
// 고객 프로필 조회 by authUserId
function findCustomerByAuthUserId(authUserId) {
    return __awaiter(this, void 0, void 0, function* () {
        return prisma_1.default.customer.findUnique({
            where: { authUserId },
            include: {
                authUser: true
            }
        });
    });
}
// 고객 프로필 생성
function createCustomerProfile(data) {
    return __awaiter(this, void 0, void 0, function* () {
        return prisma_1.default.customer.create({ data });
    });
}
// 고객 프로필 수정
function updateCustomerProfile(authUserId, data) {
    return __awaiter(this, void 0, void 0, function* () {
        return prisma_1.default.customer.update({
            where: { authUserId },
            data,
            include: {
                authUser: true
            }
        });
    });
}
// 고객 프로필 조회 by customerId (id 직접 조회)
function getCustomerById(id) {
    return __awaiter(this, void 0, void 0, function* () {
        return prisma_1.default.customer.findUnique({
            where: { id },
            include: {
                authUser: true
            }
        });
    });
}
// 기사 프로필 조회 by authUserId
function findDriverByAuthUserId(authUserId) {
    return __awaiter(this, void 0, void 0, function* () {
        return prisma_1.default.driver.findUnique({
            where: { authUserId },
            include: {
                serviceAreas: true // 기사 서비스 지역도 포함
            }
        });
    });
}
// 기사 프로필 생성
function createDriverProfile(data) {
    return __awaiter(this, void 0, void 0, function* () {
        return prisma_1.default.driver.create({ data });
    });
}
// 기사 프로필 수정
function updateDriverProfile(authUserId, data) {
    return __awaiter(this, void 0, void 0, function* () {
        return prisma_1.default.driver.update({
            where: { authUserId },
            data
        });
    });
}
// 기사 프로필 조회 by driverId (id 직접 조회)
function getDriverById(id) {
    return __awaiter(this, void 0, void 0, function* () {
        return prisma_1.default.driver.findUnique({
            where: { id },
            include: {
                serviceAreas: true
            }
        });
    });
}
// 기존 기사 서비스 지역 삭제
function deleteDriverServiceAreas(driverId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield prisma_1.default.driverServiceArea.deleteMany({
            where: { driverId }
        });
    });
}
// 기사 서비스 지역 일괄 생성
function createDriverServiceAreas(data) {
    return __awaiter(this, void 0, void 0, function* () {
        yield prisma_1.default.driverServiceArea.createMany({ data });
    });
}
exports.default = {
    findCustomerByAuthUserId,
    createCustomerProfile,
    updateCustomerProfile,
    getCustomerById,
    findDriverByAuthUserId,
    createDriverProfile,
    updateDriverProfile,
    getDriverById,
    deleteDriverServiceAreas,
    createDriverServiceAreas
};
//# sourceMappingURL=profile.repository.js.map