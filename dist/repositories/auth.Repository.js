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
// 이메일로 AuthUser 조회 (프로필 포함)
function findByEmail(email) {
    return __awaiter(this, void 0, void 0, function* () {
        return prisma_1.default.authUser.findUnique({
            where: { email },
            include: {
                customer: true,
                driver: {
                    select: { nickname: true }
                }
            }
        });
    });
}
// ID로 AuthUser 조회 (프로필 포함)
function findById(id) {
    return __awaiter(this, void 0, void 0, function* () {
        return prisma_1.default.authUser.findUnique({
            where: { id },
            include: {
                customer: true,
                driver: {
                    select: { nickname: true }
                }
            }
        });
    });
}
// 소셜 로그인 providerId로 조회
function findByProviderId(provider, providerId) {
    return __awaiter(this, void 0, void 0, function* () {
        return prisma_1.default.authUser.findFirst({
            where: {
                provider,
                providerId
            },
            include: { customer: true, driver: true }
        });
    });
}
// ID로 AuthUser 조회 (비밀번호 포함, 인증용)
function findAuthUserWithPassword(id) {
    return __awaiter(this, void 0, void 0, function* () {
        return prisma_1.default.authUser.findUnique({
            where: { id }
        });
    });
}
// 회원가입 시 AuthUser 생성 (프로필 없이)
function createAuthUser(data) {
    return __awaiter(this, void 0, void 0, function* () {
        return prisma_1.default.authUser.create({
            data
        });
    });
}
// authUser 정보를 업데이트하는 함수
function updateAuthUser(id, data) {
    return __awaiter(this, void 0, void 0, function* () {
        yield prisma_1.default.authUser.update({
            where: { id },
            data
        });
    });
}
exports.default = {
    findByEmail,
    findById,
    findByProviderId,
    createAuthUser,
    updateAuthUser,
    findAuthUserWithPassword
};
//# sourceMappingURL=auth.repository.js.map