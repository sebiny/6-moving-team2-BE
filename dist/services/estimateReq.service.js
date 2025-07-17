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
const estimateReq_repository_1 = __importDefault(require("../repositories/estimateReq.repository"));
// DB에 주소 등록
function createAddress(data) {
    return __awaiter(this, void 0, void 0, function* () {
        const { postalCode, street, detail } = data;
        const existing = yield estimateReq_repository_1.default.findAddressByFields(postalCode, street, detail);
        if (existing)
            return existing;
        return estimateReq_repository_1.default.createAddress(data);
    });
}
// 고객 주소 연결
function linkCustomerAddress(data) {
    return __awaiter(this, void 0, void 0, function* () {
        return estimateReq_repository_1.default.linkCustomerAddress(data);
    });
}
// 고객 주소 목록 조회
function getCustomerAddressesByRole(customerId, role) {
    return __awaiter(this, void 0, void 0, function* () {
        return estimateReq_repository_1.default.getCustomerAddressesByRole(customerId, role);
    });
}
// 견적 요청 생성
function createEstimateRequest(data) {
    return __awaiter(this, void 0, void 0, function* () {
        const { customerId } = data;
        const active = yield estimateReq_repository_1.default.findActiveEstimateRequest(customerId);
        if (active) {
            throw new Error("현재 진행 중인 이사 견적이 있습니다.");
        }
        // TODO: 최대 5명의 기사 요청 제한
        return estimateReq_repository_1.default.createEstimateRequest(data);
    });
}
exports.default = {
    createAddress,
    linkCustomerAddress,
    getCustomerAddressesByRole,
    createEstimateRequest
};
//# sourceMappingURL=estimateReq.service.js.map