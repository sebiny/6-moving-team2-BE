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
// DB에 주소 등록
function createAddress(data) {
    return __awaiter(this, void 0, void 0, function* () {
        return prisma_1.default.address.create({ data });
    });
}
// 주소 중복 체크
function findAddressByFields(postalCode, street, detail) {
    return __awaiter(this, void 0, void 0, function* () {
        return prisma_1.default.address.findFirst({
            where: Object.assign({ postalCode,
                street }, (detail !== undefined ? { detail } : {}))
        });
    });
}
// 고객(customer) 테이블에 연결(FROM, TO)
function linkCustomerAddress(data) {
    return __awaiter(this, void 0, void 0, function* () {
        return prisma_1.default.customerAddress.create({ data });
    });
}
// 고객(customer) 테이블에서 조회(FROM, TO)
function getCustomerAddressesByRole(customerId, role) {
    return __awaiter(this, void 0, void 0, function* () {
        return prisma_1.default.customerAddress.findMany({
            where: {
                customerId,
                role,
                deletedAt: null
            },
            include: {
                address: true
            }
        });
    });
}
// 견적 요청
function createEstimateRequest(data) {
    return __awaiter(this, void 0, void 0, function* () {
        return prisma_1.default.estimateRequest.create({ data });
    });
}
// 활성 견적 요청 조회
function findActiveEstimateRequest(customerId) {
    return __awaiter(this, void 0, void 0, function* () {
        return prisma_1.default.estimateRequest.findFirst({
            where: {
                customerId,
                deletedAt: null,
                moveDate: {
                    gt: new Date()
                },
                status: {
                    in: ["PENDING", "APPROVED"]
                }
            }
        });
    });
}
exports.default = {
    createAddress,
    findAddressByFields,
    linkCustomerAddress,
    getCustomerAddressesByRole,
    createEstimateRequest,
    findActiveEstimateRequest
};
//# sourceMappingURL=estimateReq.repository.js.map